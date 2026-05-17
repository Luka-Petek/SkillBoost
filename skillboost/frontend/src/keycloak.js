import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:9080',
    realm: 'SkillBoost',
    clientId: 'skillboost-frontend',
});

export default keycloak;