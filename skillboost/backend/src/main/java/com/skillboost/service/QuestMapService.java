package com.skillboost.service;

import com.skillboost.dto.QuestMapResponse;
import com.skillboost.model.QuestProgress;
import com.skillboost.model.Skill;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.TrainingSession;
import com.skillboost.repository.QuestProgressRepository;
import com.skillboost.repository.SkillRepository;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QuestMapService {
    private static final String STATUS_AVAILABLE = "AVAILABLE";
    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_READY_TO_CLAIM = "READY_TO_CLAIM";
    private static final String STATUS_COMPLETED = "COMPLETED";

    private static final List<RoadmapPhaseDefinition> PHASES = List.of(
            new RoadmapPhaseDefinition("foundation", "Pristaniška vrata", "Vstop v mesto", "Prva četrt odklene osnovno komunikacijo: jasno povej, dobro poslušaj in napiši odgovor brez zmede.", "violet", "🌉", 1),
            new RoadmapPhaseDefinition("social-core", "Trg odnosov", "Ljudje in odnosi", "Trg odnosov odklene pomoč, empatijo, meje in grajenje poznanstev brez nepotrebne drame.", "green", "🤝", 2),
            new RoadmapPhaseDefinition("work-arena", "Delovna četrt", "Delo in sestanki", "Delovna četrt vodi skozi sestanke, povratno informacijo, prioritete in upravljanje časa.", "amber", "🏢", 3),
            new RoadmapPhaseDefinition("focus-engine", "Park fokusa", "Mir, fokus, odločitve", "Park fokusa gradi disciplino, stresno odpornost, čustveno regulacijo in odločanje pod pritiskom.", "blue", "🌿", 4),
            new RoadmapPhaseDefinition("career-league", "Karierne višave", "Karierni vzpon", "Stolpnice kariere odklenejo intervjuje, samozavest, pogajanja in osnovno vodenje.", "pink", "🚀", 5),
            new RoadmapPhaseDefinition("boss-tower", "Citadelni stolp", "Finalni izzivi", "Citadela je finalna četrt: konflikti, težki pogovori, odpornost in finančni pogovori.", "teal", "🏰", 6)
    );

    private static final List<RoadmapNodeDefinition> ROADMAP = List.of(
            node("public-speaking", "foundation", 1, 12, 75, 58, false, "Zgradi prvo komunikacijsko stavbo in odpri aktivno poslušanje."),
            node("active-listening", "foundation", 2, 24, 68, 58, false, "Odklene pisni studio in bolj jasne odgovore."),
            node("clear-writing", "foundation", 3, 36, 76, 60, false, "Odklene digitalni komunikacijski checkpoint."),
            node("digital-communication", "foundation", 4, 50, 68, 65, true, "Pristaniška vrata boss odklene Trg odnosov."),

            node("asking-for-help", "social-core", 5, 50, 39, 60, false, "Odklene Empathy Hall."),
            node("empathy", "social-core", 6, 36, 31, 62, false, "Odklene Boundary Gate."),
            node("boundaries", "social-core", 7, 22, 40, 66, false, "Odklene Networking Hub."),
            node("networking", "social-core", 8, 10, 32, 68, true, "Trg odnosov boss odklene Delovna četrt."),

            node("meeting-facilitation", "work-arena", 9, 27, 54, 62, false, "Odklene Feedback Studio."),
            node("feedback-giving", "work-arena", 10, 42, 48, 68, false, "Odklene Središče prioritet."),
            node("prioritization", "work-arena", 11, 58, 55, 66, false, "Odklene Time Control Tower."),
            node("time-management", "work-arena", 12, 73, 48, 70, true, "Delovna četrt boss odklene Park fokusa."),

            node("focus-discipline", "focus-engine", 13, 78, 29, 64, false, "Odklene Stress Garden."),
            node("stress-management", "focus-engine", 14, 65, 19, 66, false, "Odklene Emotion Lab."),
            node("emotional-regulation", "focus-engine", 15, 53, 28, 70, false, "Odklene Decision Bridge."),
            node("decision-making", "focus-engine", 16, 42, 20, 72, true, "Park fokusa boss odklene Karierne višave."),

            node("job-interview", "career-league", 17, 64, 72, 70, false, "Odklene Confidence Tower."),
            node("self-confidence", "career-league", 18, 75, 82, 68, false, "Odklene Negotiation Exchange."),
            node("negotiation", "career-league", 19, 86, 73, 74, false, "Odklene Leadership HQ."),
            node("leadership-basics", "career-league", 20, 94, 83, 76, true, "Karierne višave boss odklene Citadelni stolp."),

            node("conflict-resolution", "boss-tower", 21, 90, 47, 76, false, "Odklene Difficult Conversation Gate."),
            node("difficult-conversations", "boss-tower", 22, 80, 38, 78, false, "Odklene Resilience Armory."),
            node("resilience", "boss-tower", 23, 70, 47, 76, false, "Odklene finalni finance boss."),
            node("personal-finance", "boss-tower", 24, 60, 38, 78, true, "Finalni city boss: zaključi trenutno SkillCity mapo.")
    );

    private final SkillRepository skillRepository;
    private final TrainingChallengeRepository challengeRepository;
    private final TrainingSessionRepository sessionRepository;
    private final QuestProgressRepository questProgressRepository;
    private final UserProfileRepository userRepository;

    public QuestMapService(
            SkillRepository skillRepository,
            TrainingChallengeRepository challengeRepository,
            TrainingSessionRepository sessionRepository,
            QuestProgressRepository questProgressRepository,
            UserProfileRepository userRepository
    ) {
        this.skillRepository = skillRepository;
        this.challengeRepository = challengeRepository;
        this.sessionRepository = sessionRepository;
        this.questProgressRepository = questProgressRepository;
        this.userRepository = userRepository;
    }

    public QuestMapResponse buildForUser(String userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Uporabnik ni najden."));

        List<Skill> skills = skillRepository.findAll();
        List<TrainingChallenge> challenges = challengeRepository.findAll();
        List<TrainingSession> sessions = sessionRepository.findByUserId(userId);
        List<QuestProgress> progressItems = questProgressRepository.findByUserId(userId);

        Map<String, Skill> skillByKey = skills.stream()
                .collect(Collectors.toMap(
                        skill -> normalize(skill.getKey()),
                        skill -> skill,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, TrainingChallenge> challengeBySkill = challenges.stream()
                .sorted(Comparator.comparing(TrainingChallenge::getEstimatedMinutes).thenComparing(TrainingChallenge::getTitle, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toMap(
                        challenge -> normalize(challenge.getSkillKey()),
                        challenge -> challenge,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, QuestProgress> progressByNode = progressItems.stream()
                .collect(Collectors.toMap(
                        item -> normalize(item.getNodeKey()),
                        item -> item,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, SkillSessionStats> statsBySkill = buildSessionStats(sessions);
        List<QuestMapResponse.QuestNode> nodes = new ArrayList<>();
        List<String> completedKeys = new ArrayList<>();

        for (RoadmapNodeDefinition definition : ROADMAP) {
            Skill skill = skillByKey.get(definition.skillKey());
            TrainingChallenge challenge = challengeBySkill.get(definition.skillKey());
            QuestProgress progress = progressByNode.get(definition.skillKey());
            SkillSessionStats stats = statsBySkill.getOrDefault(definition.skillKey(), SkillSessionStats.empty());
            int bestScore = Math.max(stats.bestScore(), progress == null ? 0 : progress.getBestScore());
            int sessionCount = Math.max(stats.sessions(), progress == null ? 0 : progress.getSessions());

            boolean pathUnlocked = definition.order() == 1 || completedKeys.contains(previousSkillKey(definition.order()));
            boolean scoreReached = bestScore >= definition.requiredScore();
            boolean completedByClaim = progress != null
                    && STATUS_COMPLETED.equalsIgnoreCase(progress.getStatus())
                    && scoreReached;
            boolean completed = pathUnlocked && completedByClaim;
            boolean unlocked = completed || pathUnlocked;
            boolean claimable = !completed && unlocked && scoreReached;
            boolean inProgress = !completed && unlocked && (
                    claimable
                            || sessionCount > 0
                            || bestScore > 0
                            || (progress != null && STATUS_IN_PROGRESS.equalsIgnoreCase(progress.getStatus()))
                            || (progress != null && STATUS_READY_TO_CLAIM.equalsIgnoreCase(progress.getStatus()))
            );

            String status = completed
                    ? STATUS_COMPLETED
                    : claimable ? STATUS_READY_TO_CLAIM : inProgress ? STATUS_IN_PROGRESS : unlocked ? STATUS_AVAILABLE : "LOCKED";

            if (completed) {
                completedKeys.add(definition.skillKey());
            }

            RoadmapPhaseDefinition phase = phaseFor(definition.phaseId());
            String previousName = previousSkillName(definition.order(), skillByKey);
            String lockReason = unlocked ? "" : "Najprej zgradi prejšnjo stavbo: " + previousName + ". Score za to veščino se lahko shrani, mesto pa se odpre po vrstnem redu.";

            nodes.add(new QuestMapResponse.QuestNode(
                    definition.skillKey(),
                    definition.skillKey(),
                    definition.skillKey(),
                    skill == null ? fallbackTitle(definition.skillKey()) : skill.getName(),
                    skill == null ? phase.title() : skill.getCategory(),
                    phase.id(),
                    phase.title(),
                    phase.theme(),
                    phase.emoji(),
                    challenge == null ? null : challenge.getId(),
                    challenge == null ? "Mini trening" : challenge.getTitle(),
                    challenge == null ? fallbackScenario(definition.skillKey()) : challenge.getScenario(),
                    challenge == null ? "Oddaj kratek, konkreten odgovor in zaključi s povezanim naslednjim korakom." : challenge.getExpectedOutcome(),
                    challenge == null ? List.of() : safeList(challenge.getEvaluationCriteria()),
                    skill == null ? List.of() : safeList(skill.getOutcomes()),
                    status,
                    unlocked,
                    completed,
                    inProgress,
                    claimable,
                    definition.boss(),
                    definition.order(),
                    phase.order(),
                    definition.x(),
                    definition.y(),
                    definition.requiredScore(),
                    bestScore,
                    sessionCount,
                    calculateRewardXp(definition, challenge, skill),
                    definition.boss() ? 4 : 2,
                    challenge == null ? (skill == null ? 10 : skill.getEstimatedMinutes()) : challenge.getEstimatedMinutes(),
                    lockReason,
                    definition.nextUnlockText(),
                    progress == null || progress.getCompletedAt() == null ? null : progress.getCompletedAt().toString(),
                    progress == null || progress.getStartedAt() == null ? null : progress.getStartedAt().toString()
            ));
        }

        List<QuestMapResponse.QuestPhase> phases = buildPhases(nodes);
        QuestMapResponse.QuestSummary summary = buildSummary(nodes);
        List<String> recommendations = buildRecommendations(nodes, sessions);

        return new QuestMapResponse(
                userId,
                "SkillCity",
                "Odklepaj mesto po četrtih: vsaka zgrajena stavba pomeni osvojeno veščino, vsak boss pa odpre novo območje.",
                summary,
                phases,
                nodes,
                recommendations
        );
    }

    public QuestMapResponse updateNode(String userId, String nodeKey, String rawAction) {
        String normalizedNodeKey = normalize(nodeKey);
        String action = normalizeAction(rawAction);
        QuestMapResponse currentMap = buildForUser(userId);
        QuestMapResponse.QuestNode currentNode = currentMap.nodes().stream()
                .filter(node -> node.nodeKey().equalsIgnoreCase(normalizedNodeKey))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Vozlišče misije ni najdeno."));

        if (!currentNode.unlocked() && !"RESET".equals(action)) {
            throw new IllegalArgumentException(currentNode.lockReason().isBlank()
                    ? "Quest node is locked."
                    : currentNode.lockReason());
        }

        QuestProgress progress = questProgressRepository.findByUserIdAndNodeKey(userId, normalizedNodeKey)
                .orElseGet(() -> {
                    QuestProgress created = new QuestProgress();
                    created.setUserId(userId);
                    created.setNodeKey(normalizedNodeKey);
                    return created;
                });

        LocalDateTime now = LocalDateTime.now();
        if ("START".equals(action)) {
            progress.setStatus(STATUS_IN_PROGRESS);
            if (progress.getStartedAt() == null) {
                progress.setStartedAt(now);
            }
        } else if ("COMPLETE".equals(action)) {
            int earnedScore = Math.max(currentNode.bestScore(), progress.getBestScore());
            if (earnedScore < currentNode.requiredScore()) {
                throw new IllegalArgumentException("Za prevzem nagrade najprej dosezi vsaj "
                        + currentNode.requiredScore() + "/100 v simulatorju. Trenutni najboljši rezultat je " + earnedScore + ".");
            }
            progress.setStatus(STATUS_COMPLETED);
            progress.setManualCompletion(true);
            progress.setCompletedAt(now);
            if (progress.getStartedAt() == null) {
                progress.setStartedAt(now);
            }
            progress.setBestScore(earnedScore);
            progress.setSessions(Math.max(progress.getSessions(), currentNode.sessions()));
        } else if ("RESET".equals(action)) {
            if (progress.getId() != null) {
                questProgressRepository.delete(progress);
            }
            return buildForUser(userId);
        } else {
            throw new IllegalArgumentException("Unsupported quest action: " + rawAction);
        }

        progress.setUpdatedAt(now);
        questProgressRepository.save(progress);
        return buildForUser(userId);
    }

    public void syncProgressAfterSession(TrainingSession session) {
        if (session == null || session.getUserId() == null || session.getUserId().isBlank()) {
            return;
        }

        for (String skillKey : sessionSkillKeys(session)) {
            Optional<RoadmapNodeDefinition> definition = ROADMAP.stream()
                    .filter(node -> node.skillKey().equalsIgnoreCase(skillKey))
                    .findFirst();

            if (definition.isEmpty()) {
                continue;
            }

            int earnedScore = scoreForSkill(session, definition.get().skillKey());
            QuestMapResponse currentMap = buildForUser(session.getUserId());
            QuestMapResponse.QuestNode roadmapNode = currentMap.nodes().stream()
                    .filter(node -> node.nodeKey().equalsIgnoreCase(definition.get().skillKey()))
                    .findFirst()
                    .orElse(null);

            QuestProgress progress = questProgressRepository.findByUserIdAndNodeKey(session.getUserId(), definition.get().skillKey())
                    .orElseGet(() -> {
                        QuestProgress created = new QuestProgress();
                        created.setUserId(session.getUserId());
                        created.setNodeKey(definition.get().skillKey());
                        created.setStartedAt(session.getCreatedAt() == null ? LocalDateTime.now() : session.getCreatedAt());
                        return created;
                    });

            progress.setSessions(progress.getSessions() + 1);
            progress.setBestScore(Math.max(progress.getBestScore(), earnedScore));

            boolean pathUnlocked = roadmapNode != null && roadmapNode.unlocked();
            boolean scoreCompletesNode = earnedScore >= definition.get().requiredScore();

            if (pathUnlocked && scoreCompletesNode && !STATUS_COMPLETED.equalsIgnoreCase(progress.getStatus())) {
                progress.setStatus(STATUS_READY_TO_CLAIM);
            } else if (pathUnlocked && !STATUS_COMPLETED.equalsIgnoreCase(progress.getStatus())) {
                progress.setStatus(STATUS_IN_PROGRESS);
            }

            progress.setUpdatedAt(LocalDateTime.now());
            questProgressRepository.save(progress);
        }
    }

    public void resetUserProgress(String userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Uporabnik ni najden."));
        questProgressRepository.deleteByUserId(userId);
    }

    private List<QuestMapResponse.QuestPhase> buildPhases(List<QuestMapResponse.QuestNode> nodes) {
        return PHASES.stream().map(phase -> {
            List<QuestMapResponse.QuestNode> phaseNodes = nodes.stream()
                    .filter(node -> node.phaseId().equals(phase.id()))
                    .toList();
            int total = phaseNodes.size();
            int completed = (int) phaseNodes.stream().filter(QuestMapResponse.QuestNode::completed).count();
            int unlocked = (int) phaseNodes.stream().filter(QuestMapResponse.QuestNode::unlocked).count();
            int percent = total == 0 ? 0 : Math.round((completed * 100f) / total);
            String bossNodeKey = phaseNodes.stream()
                    .filter(QuestMapResponse.QuestNode::boss)
                    .map(QuestMapResponse.QuestNode::nodeKey)
                    .findFirst()
                    .orElse(null);
            return new QuestMapResponse.QuestPhase(
                    phase.id(),
                    phase.title(),
                    phase.subtitle(),
                    phase.description(),
                    phase.theme(),
                    phase.emoji(),
                    phase.order(),
                    total,
                    completed,
                    unlocked,
                    percent,
                    unlocked > 0,
                    bossNodeKey
            );
        }).toList();
    }

    private QuestMapResponse.QuestSummary buildSummary(List<QuestMapResponse.QuestNode> nodes) {
        int total = nodes.size();
        int completed = (int) nodes.stream().filter(QuestMapResponse.QuestNode::completed).count();
        int unlocked = (int) nodes.stream().filter(QuestMapResponse.QuestNode::unlocked).count();
        int inProgress = (int) nodes.stream().filter(QuestMapResponse.QuestNode::inProgress).count();
        int percent = total == 0 ? 0 : Math.round((completed * 100f) / total);
        int totalXp = nodes.stream()
                .filter(QuestMapResponse.QuestNode::completed)
                .mapToInt(QuestMapResponse.QuestNode::rewardXp)
                .sum();
        String currentNode = nodes.stream()
                .filter(node -> node.unlocked() && !node.completed())
                .map(QuestMapResponse.QuestNode::nodeKey)
                .findFirst()
                .orElse(nodes.stream().reduce((first, second) -> second).map(QuestMapResponse.QuestNode::nodeKey).orElse(null));
        String nextBoss = nodes.stream()
                .filter(node -> node.boss() && !node.completed())
                .map(QuestMapResponse.QuestNode::nodeKey)
                .findFirst()
                .orElse(null);
        String currentPhase = nodes.stream()
                .filter(node -> node.nodeKey().equals(currentNode))
                .map(QuestMapResponse.QuestNode::phaseId)
                .findFirst()
                .orElse(PHASES.get(0).id());

        return new QuestMapResponse.QuestSummary(total, completed, unlocked, inProgress, percent, totalXp, currentNode, nextBoss, currentPhase);
    }

    private List<String> buildRecommendations(List<QuestMapResponse.QuestNode> nodes, List<TrainingSession> sessions) {
        List<String> recommendations = new ArrayList<>();
        nodes.stream()
                .filter(node -> node.unlocked() && !node.completed())
                .findFirst()
                .ifPresent(node -> recommendations.add("Naslednja najbolj logična stavba: " + node.skillName() + "."));

        nodes.stream()
                .filter(QuestMapResponse.QuestNode::claimable)
                .findFirst()
                .ifPresent(node -> recommendations.add("Prevzemi nagrado za " + node.skillName() + ": rezultat je dosežen, stavba samo še čaka na odklep."));

        nodes.stream()
                .filter(node -> node.inProgress() && !node.completed() && !node.claimable() && node.bestScore() > 0)
                .findFirst()
                .ifPresent(node -> recommendations.add("Ponovi " + node.skillName() + ": manjka ti še " + Math.max(0, node.requiredScore() - node.bestScore()) + " rezultatnih točk, da se stavba prižge."));

        nodes.stream()
                .filter(node -> node.boss() && node.unlocked() && !node.completed())
                .findFirst()
                .ifPresent(node -> recommendations.add("City boss je pripravljen: " + node.skillName() + " zahteva vsaj " + node.requiredScore() + "/100."));

        if (sessions.isEmpty()) {
            recommendations.add("Začni s prvo stavbo v Pristaniška vrata in oddaj kratek, realen odgovor v simulatorju.");
        }

        return recommendations.stream().distinct().limit(4).toList();
    }

    private Map<String, SkillSessionStats> buildSessionStats(List<TrainingSession> sessions) {
        Map<String, List<TrainingSession>> grouped = sessions.stream()
                .flatMap(session -> sessionSkillKeys(session).stream().map(skillKey -> Map.entry(skillKey, session)))
                .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

        Map<String, SkillSessionStats> result = new HashMap<>();
        grouped.forEach((skillKey, items) -> {
            int bestScore = items.stream().mapToInt(session -> scoreForSkill(session, skillKey)).max().orElse(0);
            result.put(skillKey, new SkillSessionStats(items.size(), bestScore));
        });
        return result;
    }

    private int scoreForSkill(TrainingSession session, String skillKey) {
        if (session == null) return 0;
        String normalizedSkillKey = normalize(skillKey);
        if (session.getStructuredScores() != null) {
            Integer exactScore = session.getStructuredScores().get(normalizedSkillKey);
            if (exactScore != null) {
                return exactScore;
            }
            for (Map.Entry<String, Integer> entry : session.getStructuredScores().entrySet()) {
                if (normalize(entry.getKey()).equals(normalizedSkillKey) && entry.getValue() != null) {
                    return entry.getValue();
                }
            }
        }
        return session.getScore();
    }

    private List<String> sessionSkillKeys(TrainingSession session) {
        if (session == null) return List.of();
        if (session.getSkillKeys() != null && !session.getSkillKeys().isEmpty()) {
            return session.getSkillKeys().stream()
                    .filter(Objects::nonNull)
                    .map(this::normalize)
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
        }
        String legacy = session.getSkillKey();
        if (legacy == null || legacy.isBlank()) {
            return List.of();
        }
        return List.of(legacy.split(","))
                .stream()
                .map(this::normalize)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private static RoadmapNodeDefinition node(String skillKey, String phaseId, int order, int x, int y, int requiredScore, boolean boss, String nextUnlockText) {
        return new RoadmapNodeDefinition(skillKey, phaseId, order, x, y, requiredScore, boss, nextUnlockText);
    }

    private RoadmapPhaseDefinition phaseFor(String phaseId) {
        return PHASES.stream()
                .filter(phase -> phase.id().equals(phaseId))
                .findFirst()
                .orElse(PHASES.get(0));
    }

    private String previousSkillKey(int order) {
        return ROADMAP.stream()
                .filter(node -> node.order() == order - 1)
                .map(RoadmapNodeDefinition::skillKey)
                .findFirst()
                .orElse(ROADMAP.get(0).skillKey());
    }

    private String previousSkillName(int order, Map<String, Skill> skillByKey) {
        String previousSkillKey = previousSkillKey(order);
        Skill skill = skillByKey.get(previousSkillKey);
        return skill == null ? fallbackTitle(previousSkillKey) : skill.getName();
    }

    private int calculateRewardXp(RoadmapNodeDefinition definition, TrainingChallenge challenge, Skill skill) {
        int minutes = challenge == null
                ? skill == null ? 10 : skill.getEstimatedMinutes()
                : challenge.getEstimatedMinutes();
        return 50 + Math.min(70, minutes * 4) + (definition.boss() ? 35 : 0);
    }

    private String fallbackTitle(String skillKey) {
        if (skillKey == null || skillKey.isBlank()) return "Quest";
        return List.of(skillKey.split("-"))
                .stream()
                .filter(value -> !value.isBlank())
                .map(value -> value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String fallbackScenario(String skillKey) {
        return "Izberi realno situacijo za " + fallbackTitle(skillKey).toLowerCase(Locale.ROOT) + " in odgovori kot v pogovoru z osebo.";
    }

    private List<String> safeList(List<String> value) {
        return value == null ? List.of() : value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeAction(String value) {
        if (value == null || value.isBlank()) return "START";
        return value.trim().toUpperCase(Locale.ROOT).replace('-', '_');
    }

    private record RoadmapPhaseDefinition(
            String id,
            String title,
            String subtitle,
            String description,
            String theme,
            String emoji,
            int order
    ) {
    }

    private record RoadmapNodeDefinition(
            String skillKey,
            String phaseId,
            int order,
            int x,
            int y,
            int requiredScore,
            boolean boss,
            String nextUnlockText
    ) {
    }

    private record SkillSessionStats(int sessions, int bestScore) {
        static SkillSessionStats empty() {
            return new SkillSessionStats(0, 0);
        }
    }
}
