// ============================================
// GITHUB CONFIGURATION
// ============================================
// Follow setup instructions in SETUP.md to configure this

const GITHUB_CONFIG = {
    // Your GitHub username
    owner: 'RespectfulGuy',
    
    // Your repository name
    repo: 'TheSapdiest',
    
    // Your GitHub Personal Access Token
    // Generate at: https://github.com/settings/tokens
    // Required scopes: 'repo' (Full control of private repositories)
    token: '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' ,
    
    // Path to registry file in your repo
    registryPath: 'registry.json',
    
    // Branch name (usually 'main' or 'master')
    branch: 'main'
};

// DO NOT EDIT BELOW THIS LINE
const GITHUB_API = {
    baseUrl: 'https://api.github.com',
    getFileUrl: () => `${GITHUB_API.baseUrl}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.registryPath}`,
    headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    }
};
