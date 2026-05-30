package com.skillboost.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${skillboost.security.enabled:false}")
    private boolean securityEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        if (!securityEnabled) {
            http.authorizeHttpRequests(auth ->
                    auth.anyRequest().permitAll()
            );
            return http.build();
        }

        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/health",
                                "/api/skills",
                                "/api/challenges",
                                "/api/prompts"
                        ).permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/users")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/users/**")
                        .authenticated()

                        .requestMatchers("/api/mentor/**")
                        .hasAnyRole("MENTOR", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/prompts")
                        .hasAnyRole("MENTOR", "ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/api/sessions/*/mentor-note")
                        .hasAnyRole("MENTOR", "ADMIN")

                        .requestMatchers("/api/users/**")
                        .hasAnyRole("MENTOR", "ADMIN")

                        .requestMatchers(
                                "/api/profile/**",
                                "/api/reports/**",
                                "/api/sessions/**"
                        ).authenticated()

                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakRoleConverter()))
                );

        return http.build();
    }

    private Converter<Jwt, AbstractAuthenticationToken> keycloakRoleConverter() {
        return jwt -> new JwtAuthenticationToken(jwt, extractAuthorities(jwt));
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        Object realmAccess = jwt.getClaims().get("realm_access");

        if (realmAccess instanceof Map<?, ?> realmMap
                && realmMap.get("roles") instanceof Collection<?> roles) {

            roles.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(this::toRoleAuthority)
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        }

        Object resourceAccess = jwt.getClaims().get("resource_access");

        if (resourceAccess instanceof Map<?, ?> resources) {
            resources.values().forEach(resource -> {
                if (resource instanceof Map<?, ?> resourceMap
                        && resourceMap.get("roles") instanceof Collection<?> roles) {

                    roles.stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .map(this::toRoleAuthority)
                            .map(SimpleGrantedAuthority::new)
                            .forEach(authorities::add);
                }
            });
        }

        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        return authorities;
    }

    private String toRoleAuthority(String role) {
        return "ROLE_" + role
                .toUpperCase(Locale.ROOT)
                .replace("-", "_");
    }
}