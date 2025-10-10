class PermissionsManager {
  constructor(config, teamspeak) {
    this.config = config;
    this.teamspeak = teamspeak;
    this.allowedGroupIds = config.allowedGroupIds || [];
    this.allowedUIDs = config.allowedUIDs || [];
    this.requireBoth = config.requireBoth || false;
  }

  /**
   * Check if a client has permission to use bot commands
   */
  async checkPermission(client) {
    try {
      // If no restrictions are set, allow everyone
      if (this.allowedGroupIds.length === 0 && this.allowedUIDs.length === 0) {
        return true;
      }

      // Get client info
      const clientInfo = await this.teamspeak.getClientByID(client.clid);
      const clientUID = clientInfo.client_unique_identifier;

      // Check UID permission
      const hasUIDPermission = this.allowedUIDs.length === 0 || this.allowedUIDs.includes(clientUID);

      // Check group permission
      const hasGroupPermission = await this.checkGroupPermission(client.clid);

      // Determine permission based on requireBoth setting
      if (this.requireBoth) {
        // User must meet BOTH UID and group requirements
        return hasUIDPermission && hasGroupPermission;
      } else {
        // User must meet EITHER UID or group requirement
        return hasUIDPermission || hasGroupPermission;
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Check if client is in any of the allowed server groups
   */
  async checkGroupPermission(clientId) {
    try {
      // If no group restrictions, return true
      if (this.allowedGroupIds.length === 0) {
        return true;
      }

      // Get client's server groups
      const serverGroupsByClientId = await this.teamspeak.serverGroupsByClientID(clientId);

      // Check if client is in any allowed group
      for (const group of serverGroupsByClientId) {
        if (this.allowedGroupIds.includes(parseInt(group.sgid))) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking group permission:', error);
      return false;
    }
  }

  /**
   * Add a UID to the allowed list
   */
  addAllowedUID(uid) {
    if (!this.allowedUIDs.includes(uid)) {
      this.allowedUIDs.push(uid);
      return true;
    }
    return false;
  }

  /**
   * Remove a UID from the allowed list
   */
  removeAllowedUID(uid) {
    const index = this.allowedUIDs.indexOf(uid);
    if (index > -1) {
      this.allowedUIDs.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add a group ID to the allowed list
   */
  addAllowedGroup(groupId) {
    if (!this.allowedGroupIds.includes(groupId)) {
      this.allowedGroupIds.push(groupId);
      return true;
    }
    return false;
  }

  /**
   * Remove a group ID from the allowed list
   */
  removeAllowedGroup(groupId) {
    const index = this.allowedGroupIds.indexOf(groupId);
    if (index > -1) {
      this.allowedGroupIds.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all allowed UIDs
   */
  getAllowedUIDs() {
    return [...this.allowedUIDs];
  }

  /**
   * Get all allowed group IDs
   */
  getAllowedGroups() {
    return [...this.allowedGroupIds];
  }

  /**
   * Get client's UID by client ID
   */
  async getClientUID(clientId) {
    try {
      const clientInfo = await this.teamspeak.getClientByID(clientId);
      return clientInfo.client_unique_identifier;
    } catch (error) {
      console.error('Error getting client UID:', error);
      return null;
    }
  }

  /**
   * Get client's server groups by client ID
   */
  async getClientGroups(clientId) {
    try {
      const groups = await this.teamspeak.serverGroupsByClientID(clientId);
      return groups.map(g => ({
        id: parseInt(g.sgid),
        name: g.name
      }));
    } catch (error) {
      console.error('Error getting client groups:', error);
      return [];
    }
  }
}

module.exports = PermissionsManager;
