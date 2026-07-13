require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading data file:', error);
  }
  return {};
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

const bossTimers = new Map();

const DEFAULT_RESPAWN_MS = 1 * 60 * 60 * 1000; // 1 hour (most common MVP respawn)

const BOSS_RESPAWN_CONFIG = {
  // Low Difficulty
  'eddga': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Payon Field 10: 2h
  'eddga gld_dun01': {minMs: 8 * 60 * 60 * 1000, maxMs: 8 * 70 * 60 * 1000},
  'tao gunka': { minMs: 5 * 60 * 60 * 1000, maxMs: 5 * 60 * 60 * 1000 },   // Beach Dungeon: 5h
  'amon ra': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Pyramid B2F: 1h
  'dracula': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Geffen Dungeon 2: 1h
  'golden thief bug': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Prontera Culvert 4: 1h
  'phreeoni': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Morroc Field 15: 2h
  'arc angeling': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },
  'angeling pay_fild04': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 90 * 60 * 1000 },
  'angeling yuno_fild03': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 90 * 60 * 1000 },
  'angeling xmas_dun01': {minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 90 * 60 * 1000},

  // Medium Difficulty
  'atroce ra_fild02': { minMs: 4 * 60 * 60 * 1000, maxMs: 250 * 60 * 1000 },
  'atroce ra_fild03': { minMs: 3 * 60 * 60 * 1000, maxMs: 190 * 60 * 1000 },
  'atroce ra_fild04': { minMs: 5 * 60 * 60 * 1000, maxMs: 310 * 60 * 1000 },
  'atroce ve_fild01': { minMs: 3 * 60 * 60 * 1000, maxMs: 190 * 60 * 1000 },
  'atroce ve_fild02': { minMs: 6 * 60 * 60 * 1000, maxMs: 370 * 60 * 1000 },
  'lady tanee': { minMs: 7 * 60 * 60 * 1000, maxMs: 7 * 60 * 60 * 1000 },   // Ayothaya Dungeon 2: 7h
  'mistress': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Mt. Mjolnir 4: 2h
  'moonlight flower': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Payon Cave 5: 1h
  'osiris': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Pyramid 4F: 1h
  'drake': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Sunken Ship 2: 2h
  'pharaoh': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Sphinx 5: 1h
  'hydrolancer': { minMs: 50 * 60 * 1000, maxMs: 90 * 60 * 1000 },
  'hatii': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Lutie Field: 2h
  'turtle general': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Turtle Island 4: 1h
  'maya': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },
  'maya gld_dun03': {minMs: 8 * 60 * 60 * 1000, maxMs : 8 * 70 & 60 * 1000},
  'maya purple': { minMs: 2 * 60 * 60 * 1000, maxMs: 3 * 60 * 60 * 1000 },
  'gopinch': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Dremuchi Forest: 2h
  'ghostring SunkenShip': { minMs: 33 * 60 * 1000, maxMs: 53 * 60 * 1000 },
  'ghostring pay_fild04': { minMs: 60 * 60 * 1000, maxMs: 90 * 60 * 1000 },
  // Mid-High Difficulty
  'doppelganger': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Geffen Dungeon 3: 2h
  'doppelganger gld_dun02': {minMs: 8 * 60 * 60 * 1000, maxMs: 8 * 60 * 60 * 1000 },
  'egnigem cenia': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Somatology Lab 2: 2h
  'kiel-d-01': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Kiel Dungeon 2: 2h
  'orc hero': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Geffen Field 12: 1h
  'evil snake lord': { minMs: 94 * 60 * 1000, maxMs: 94 * 60 * 1000 },        // Kunlun Dungeon 3: 94min
  'samurai specter': { minMs: 91 * 60 * 1000, maxMs: 91 * 60 * 1000 },        // Amatsu Dungeon 3: 91min
  'vesper': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Juperos Core: 2h
  'gloom under night': { minMs: 5 * 60 * 60 * 1000, maxMs: 5 * 60 * 60 * 1000 },   // Rachel Sanctuary 5: 5h
  'white lady': { minMs: 117 * 60 * 1000, maxMs: 117 * 60 * 1000 },       // Louyang Dungeon 3: 117min
  'fallen bishop': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Cursed Monastery 2: 2h

  // High Difficulty
  'baphomet': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Labyrinth Forest 3: 2h
  'dark lord': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Glast Heim Churchyard: 1h
  'dark Lord gld_dun04': {minMs: 8 * 60 * 60 * 1000, maxMs: 8 * 60 * 70 * 1000},
  'detardeurus': { minMs: 3 * 60 * 60 * 1000, maxMs: 3 * 60 * 60 * 1000 },   // Abyss Lake 3: 3h
  'deviling yuno_fild03': {minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 90 * 60 * 1000 }, // Develing 1 h
  'deviling pay_fild04': {minMs: 2 * 60 * 60 * 1000, maxMs: 3 * 60 * 60 * 1000 }, // Develing 1 h
  'ifrit': { minMs: 11 * 60 * 60 * 1000, maxMs: 11 * 60 * 60 * 1000 },  // Thor's Volcano 3: 11h
  'lord of the dead': { minMs: 133 * 60 * 1000, maxMs: 133 * 60 * 1000 },       // Niflheim: 133min
  'orc lord': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Geffen Field 10: 2h
  'rsx 0806': { minMs: 125 * 60 * 1000, maxMs: 125 * 60 * 1000 },       // Mine Dungeon 2: 125min
  'stormy knight': { minMs: 1 * 60 * 60 * 1000, maxMs: 1 * 60 * 60 * 1000 },   // Toy Factory 2: 1h
  'valkyrie odin_tem02': { minMs: 90 * 60 * 1000, maxMs: 120 * 60 * 1000 },
  'valkyrie odin_tem03 #1': { minMs: 30 * 60 * 1000, maxMs: 50 * 60 * 1000 },
  'valkyrie odin_tem03 #2': { minMs: 30 * 60 * 1000, maxMs: 50 * 60 * 1000 }, // Odin Shrine 3: 8h
  'valkyrie randgris': { minMs: 8 * 60 * 60 * 1000, maxMs: 8 * 60 * 60 * 1000 },   // Odin Shrine 3: 8h
  'wounded morocc': { minMs: 12 * 60 * 60 * 1000, maxMs: 12 * 60 * 60 * 1000 },  // Dimensional Gorge: 12h
  'beelzebub': { minMs: 12 * 60 * 60 * 1000, maxMs: 12 * 60 * 60 * 1000 },  // Cursed Monastery 3: 12h

  // Somatology Lab 3 (random pick, 95–150 min window)
  'assassin cross eremes': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },
  'high priest margaretha': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },
  'high wizard kathryne': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },
  'lord knight seyren': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },
  'master smith howard': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },
  'sniper cecil': { minMs: 100 * 60 * 1000, maxMs: 130 * 60 * 1000 },

  // Special condition spawns (fixed timers where known)
  'ktullanux': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Ice Dungeon 3: 2h after defeat
  'garm': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },   // Retained from original
  'thanatos': { minMs: 2 * 60 * 60 * 1000, maxMs: 2 * 60 * 60 * 1000 },
};

function getBossRespawnTimes(bossName) {
  const config = BOSS_RESPAWN_CONFIG[bossName.toLowerCase()];
  if (config) {
    return config;
  }
  return { minMs: DEFAULT_RESPAWN_MS, maxMs: DEFAULT_RESPAWN_MS };
}

const BOSS_LIST = [
  'Amon Ra',
  'Arc Angeling',
  'Angeling pay_fild04',
  'Angeling yuno_fild03',
  'Angeling xmas_dun01',
  'Assassin Cross Eremes',
  'Atroce ra_fild02',
  'Atroce ra_fild03',
  'Atroce ra_fild04',
  'Atroce ve_fild01',
  'Atroce ve_fild02',
  'Baphomet',
  'Beelzebub',
  'Dark Lord',
  'Dark Lord gld_dun04',
  'Detardeurus',
  'Deviling yuno_fild03',
  'Deviling pay_fild04',
  'Doppelganger',
  'Doppelganger gld_dun02',
  'Drake',
  'Dracula',
  'Eclipse',
  'Eddga',
  'Eddga gld_dun01',
  'Egnigem Cenia',
  'Evil Snake Lord',
  'Fallen Bishop',
  'Ghostring SunkenShip',
  'Ghostring pay_fild04',
  'Gloom Under Night',
  'Golden Thief Bug',
  'Gopinch',
  'Garm',
  'Hatii',
  'High Priest Margaretha',
  'High Wizard Kathryne',
  'Hydrolancer',
  'Ifrit',
  'Kiel-D-01',
  'Ktullanux',
  'Kublin',
  'Lady Tanee',
  'Lord Knight Seyren',
  'Lord of the Dead',
  'Master Smith Howard',
  'Maya',
  'Maya gld_dun03',
  'Maya Purple',
  'Mistress',
  'Moonlight Flower',
  'Orc Hero',
  'Orc Lord',
  'Osiris',
  'Pharaoh',
  'Phreeoni',
  'RSX 0806',
  'Samurai Specter',
  'Sniper Cecil',
  'Stormy Knight',
  'Tao Gunka',
  'Turtle General',
  'Valkyrie odin_tem02',
  'Valkyrie odin_tem03 #1',
  'Valkyrie odin_tem03 #2',
  'Valkyrie Randgris',
  'Vesper',
  'White Lady',
  'Wounded Morocc',
].sort();

const NOTIFICATION_ROLE_NAME = 'Roweener';

const RAID_ROLES = ['SB', 'Devo', 'HP', 'LK', 'Prof', 'Asura', 'Stalker', 'Wiz', 'DPS', 'CREO', 'Dancer/Bard'];

const RAID_ROLE_EMOJIS = {
  'SB': '\u{1F6E1}\uFE0F',
  'Devo': '\u{1F6D0}',
  'HP': '\u2764\uFE0F\u200D\u{1FA79}',
  'LK': '\u{1F6E1}\uFE0F',
  'Prof': '\u{1F393}',
  'Asura': '\u{1F3B6}',
  'Stalker': '\u{1F575}\uFE0F',
  'Wiz': '\u2728',
  'DPS': '\u{1FA93}',
  'CREO': '\u{1FA93}',
  'Dancer/Bard': '\u{1F483} \u{1F3B6}'
};

const BIGBOSS_EMOJIS = {
  'Orc Hero': '\u{1F9CC}',
  'Garm': '\u{1F43A}',
  'Eddga': '\u{1F42F}',
  'Drake': '\u{1F3F4}\u200D\u2620\uFE0F'
};

const BIG_BOSS_NAMES = new Set(Object.keys(BOSS_RESPAWN_CONFIG));

const raidSignups = new Map();

// Maximum number of players allowed in a raid
const RAID_MAX_PLAYERS = 12;

function createTimerKey(guildId, bossName) {
  return `${guildId}:${bossName.toLowerCase()}`;
}

function normalizeBossName(inputName) {
  const lowerInput = inputName.toLowerCase();
  const match = BOSS_LIST.find(boss => boss.toLowerCase() === lowerInput);
  return match || inputName;
}

function createRaidKey(guildId, messageId) {
  return `${guildId}_${messageId}`;
}

async function getOrCreateNotificationRole(guild) {
  let role = guild.roles.cache.find(r => r.name === NOTIFICATION_ROLE_NAME);

  if (!role) {
    try {
      role = await guild.roles.create({
        name: NOTIFICATION_ROLE_NAME,
        color: 0x00AE86,
        reason: 'Boss notification role',
        mentionable: true
      });
      console.log(`Created ${NOTIFICATION_ROLE_NAME} role in ${guild.name}`);
    } catch (error) {
      console.error('Error creating notification role:', error);
      return null;
    }
  }

  return role;
}

function saveBossToDatabase(timerKey, bossData) {
  try {
    const data = readData();
    data[timerKey] = {
      bossName: bossData.bossName,
      deathTime: bossData.deathTime,
      respawnTimeMin: bossData.respawnTimeMin,
      respawnTimeMax: bossData.respawnTimeMax,
      channelId: bossData.channelId,
      guildId: bossData.guildId
    };
    writeData(data);
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

function removeBossFromDatabase(timerKey) {
  try {
    const data = readData();
    delete data[timerKey];
    writeData(data);
  } catch (error) {
    console.error('Error removing from database:', error);
  }
}

function loadBossesFromDatabase() {
  try {
    const data = readData();
    const bosses = [];

    for (const key in data) {
      const bossData = data[key];
      const hasRespawnData = bossData && (bossData.respawnTime || bossData.respawnTimeMin);
      if (hasRespawnData && !key.startsWith('raid:')) {
        bosses.push({ key, data: bossData });
      }
    }

    return bosses;
  } catch (error) {
    console.error('Error loading from database:', error);
    return [];
  }
}

function saveRaidSignup(signupKey, signupData) {
  try {
    const data = readData();
    data[signupKey] = signupData;
    writeData(data);
  } catch (error) {
    console.error('Error saving raid signup:', error);
  }
}

function removeRaidSignup(signupKey) {
  try {
    const data = readData();
    delete data[signupKey];
    writeData(data);
  } catch (error) {
    console.error('Error removing raid signup:', error);
  }
}

function loadRaidSignups() {
  try {
    const data = readData();
    const signups = [];

    for (const key in data) {
      if (key.startsWith('raid:')) {
        const signupData = data[key];
        if (signupData) {
          signups.push({ key, data: signupData });
        }
      }
    }

    return signups;
  } catch (error) {
    console.error('Error loading raid signups:', error);
    return [];
  }
}

function saveHomeChannel(guildId, channelId) {
  const data = readData();
  data[`homeChannel:${guildId}`] = channelId;
  writeData(data);
}

function getHomeChannel(guildId) {
  const data = readData();
  return data[`homeChannel:${guildId}`] || null;
}

function saveBigBossChannel(guildId, channelId, messageId) {
  const data = readData();
  data[`bigbossChannel:${guildId}`] = { channelId, messageId };
  writeData(data);
}

function getBigBossChannel(guildId) {
  const data = readData();
  return data[`bigbossChannel:${guildId}`] || null;
}

function saveSecondaryRoles(guildId, userId, roles) {
  const data = readData();
  data[`secondaryRoles:${guildId}_${userId}`] = roles;
  writeData(data);
}

function loadSecondaryRoles(guildId, userId) {
  const data = readData();
  return data[`secondaryRoles:${guildId}_${userId}`] || [];
}

/**
 * Returns a flat ordered list of all signed-up players across all roles,
 * preserving the order they joined (by role order, then join order within each role).
 */
function getAllSignedUpPlayers(roles) {
  const seen = new Set();
  const ordered = [];
  for (const role of RAID_ROLES) {
    for (const p of (roles[role] || [])) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        ordered.push(p);
      }
    }
  }
  return ordered;
}

function createRaidEmbed(name, roles, guildId) {
  const embed = new EmbedBuilder()
    .setTitle(name)
    .setColor(0x00AE86);

  let description = '';
  const allPlayers = getAllSignedUpPlayers(roles);
  const acceptedIds = new Set(allPlayers.slice(0, RAID_MAX_PLAYERS).map(p => p.id));

  RAID_ROLES.forEach(role => {
    const players = (roles[role] || []).filter(p => acceptedIds.has(p.id));
    if (players.length === 0) return;

    const emoji = RAID_ROLE_EMOJIS[role] || '';
    const playerNames = players.map(p => {
      const secondaryRoles = guildId ? loadSecondaryRoles(guildId, p.id) : [];
      const filteredSecondary = secondaryRoles.filter(r => r !== role);
      const secondaryEmojis = filteredSecondary.map(r => RAID_ROLE_EMOJIS[r] || '').join('');
      return secondaryEmojis ? `${p.name} (${secondaryEmojis})` : p.name;
    });
    description += `${emoji} **${role}** (${players.length})\n${playerNames.join('\n')}\n\n`;
  });

  if (allPlayers.length === 0) {
    description = 'No signups yet. Click a role button below to join!';
  } else {
    description += `**Total:** ${Math.min(allPlayers.length, RAID_MAX_PLAYERS)}/${RAID_MAX_PLAYERS} players`;

    // Show the first overflow player (slot 13) if present
    if (allPlayers.length > RAID_MAX_PLAYERS) {
      const waitlisted = allPlayers[RAID_MAX_PLAYERS]; // index 12 = 13th person
      description += `\n\n⏳ **Waitlist:** ${waitlisted.name}`;
      if (allPlayers.length > RAID_MAX_PLAYERS + 1) {
        description += ` *(+${allPlayers.length - RAID_MAX_PLAYERS - 1} more)*`;
      }
    }
  }

  embed.setDescription(description);
  return embed;
}

function createRaidButtons() {
  const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()];
  const actions = [...RAID_ROLES, 'Bump'];

  actions.forEach((action, index) => {
    const button = new ButtonBuilder().setCustomId(`raid_${action}`);

    if (action === 'Bump') {
      button.setLabel('\u2B07\uFE0F Bump').setStyle(ButtonStyle.Success);
    } else {
      button.setLabel(`${RAID_ROLE_EMOJIS[action] || ''} ${action}`).setStyle(ButtonStyle.Primary);
    }

    const rowIndex = Math.floor(index / 5);
    rows[rowIndex].addComponents(button);
  });

  return rows.filter(row => row.components.length > 0);
}

function parseUTCTime(timeStr) {
  let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    const numMatch = timeStr.match(/^(\d{3,4})$/);
    if (numMatch) {
      const num = numMatch[1].padStart(4, '0');
      match = [null, num.slice(0, 2), num.slice(2)];
    }
  }
  if (!match) return null;

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const now = new Date();
  const deathTime = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours,
    minutes,
    0,
    0
  ));

  if (deathTime > now) {
    deathTime.setUTCDate(deathTime.getUTCDate() - 1);
  }

  return deathTime;
}

function formatUTCTime(date) {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function createStatusEmbed(guildId) {
  const embed = new EmbedBuilder()
    .setTitle('\u{1F550} Boss Respawn Tracker')
    .setColor(0x00AE86);

  const now = Date.now();
  const entries = Array.from(bossTimers.entries())
    .filter(([key, timer]) => key.startsWith(`${guildId}:`))
    .map(([key, timer]) => {
      const bossName = timer.bossName;
      const timeRemainingMin = timer.respawnTimeMin - now;
      const respawnTimestampMin = Math.floor(timer.respawnTimeMin / 1000);
      const respawnTimestampMax = Math.floor(timer.respawnTimeMax / 1000);
      const deathTimeUTC = formatUTCTime(new Date(timer.deathTime));
      const hasRange = timer.respawnTimeMin !== timer.respawnTimeMax;
      const emoji = BIGBOSS_EMOJIS[bossName] || '';
      return {
        name: bossName,
        timeRemainingMin,
        respawnTimestampMin,
        respawnTimestampMax,
        deathTimeUTC,
        hasRange,
        emoji
      };
    })
    .sort((a, b) => b.timeRemainingMin - a.timeRemainingMin);

  if (entries.length === 0) {
    embed.setDescription('No bosses are currently being tracked in this server.');
    return embed;
  }

  const bossColumn = entries.map(entry => {
    return entry.emoji ? `${entry.emoji} ${entry.name}` : entry.name;
  }).join('\n');

  const diedAtColumn = entries.map(entry => {
    return `${entry.deathTimeUTC} UTC`;
  }).join('\n');

  const respawnColumn = entries.map(entry => {
    return entry.hasRange
      ? `<t:${entry.respawnTimestampMin}:R> to <t:${entry.respawnTimestampMax}:R>`
      : `<t:${entry.respawnTimestampMin}:R>`;
  }).join('\n');

  embed.addFields(
    { name: 'Boss', value: bossColumn, inline: true },
    { name: 'Died At', value: diedAtColumn, inline: true },
    { name: 'Respawns', value: respawnColumn, inline: true }
  );

  return embed;
}

function createBigBossEmbed(guildId) {
  const BIG_BOSS_ORDER = ['Drake', 'Garm', 'Orc Hero', 'Eddga'];
  const bossLines = BIG_BOSS_ORDER.map(name => {
    const timerKey = createTimerKey(guildId, name);
    const emoji = BIGBOSS_EMOJIS[name] || '';
    if (!bossTimers.has(timerKey)) {
      return { boss: `${emoji} ${name}`, diedAt: '\u2014', respawns: 'Not tracked' };
    }
    const timer = bossTimers.get(timerKey);
    const deathTimeUTC = formatUTCTime(new Date(timer.deathTime));
    const respawnTimestampMin = Math.floor(timer.respawnTimeMin / 1000);
    const respawnTimestampMax = Math.floor(timer.respawnTimeMax / 1000);
    const hasRange = timer.respawnTimeMin !== timer.respawnTimeMax;
    const respawns = hasRange
      ? `<t:${respawnTimestampMin}:R> \u2013 <t:${respawnTimestampMax}:R>`
      : `<t:${respawnTimestampMin}:R>`;
    return { boss: `${emoji} ${name}`, diedAt: `${deathTimeUTC} UTC`, respawns };
  });

  return new EmbedBuilder()
    .setTitle('Big Boss Timers')
    .setColor(0x8B0000)
    .addFields(
      { name: 'Boss', value: bossLines.map(b => b.boss).join('\n'), inline: true },
      { name: 'Died At', value: bossLines.map(b => b.diedAt).join('\n'), inline: true },
      { name: 'Respawns', value: bossLines.map(b => b.respawns).join('\n'), inline: true }
    )
    .setFooter({ text: 'Updates automatically' });
}

async function updateBigBossDashboard(guildId) {
  const stored = getBigBossChannel(guildId);
  if (!stored) return;

  const { channelId, messageId } = stored;
  const embed = createBigBossEmbed(guildId);

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  try {
    const message = await channel.messages.fetch(messageId);
    await message.edit({ embeds: [embed] });
  } catch (err) {
    const isUnknownMessage = err?.code === 10008;
    if (isUnknownMessage) {
      const newMessage = await channel.send({ embeds: [embed] });
      saveBigBossChannel(guildId, channelId, newMessage.id);
    } else {
      console.error('updateBigBossDashboard: unexpected error', err?.message);
    }
  }
}

async function scheduleBossRespawn(guildId, bossName, deathTime, respawnTimeMin, respawnTimeMax, channelId, skipDatabaseSave = false) {
  const timerKey = createTimerKey(guildId, bossName);

  if (bossTimers.has(timerKey)) {
    const existing = bossTimers.get(timerKey);
    if (existing.reminderTimeout) clearTimeout(existing.reminderTimeout);
    if (existing.cleanupTimeout) clearTimeout(existing.cleanupTimeout);
    if (existing.timeout) clearTimeout(existing.timeout);
  }

  const timeUntilRespawnMin = respawnTimeMin - Date.now();
  const timeUntilRespawnMax = respawnTimeMax - Date.now();
  const reminderDelay = Math.max(0, timeUntilRespawnMin - 60000);

  const hasRange = respawnTimeMin !== respawnTimeMax;
  const bossEmoji = BIGBOSS_EMOJIS[bossName] || '';

  const reminderTimeoutId = setTimeout(async () => {
    const homeChannelId = getHomeChannel(guildId);
    const targetChannelId = homeChannelId || channelId;
    const channel = await client.channels.fetch(targetChannelId).catch(() => null);
    if (channel) {
      const respawnTimestampMin = Math.floor(respawnTimeMin / 1000);
      const respawnTimestampMax = Math.floor(respawnTimeMax / 1000);

      let respawnText;
      if (hasRange) {
        respawnText = `${bossEmoji} **${bossName}** respawns <t:${respawnTimestampMin}:R> to <t:${respawnTimestampMax}:R>!`;
      } else {
        respawnText = `${bossEmoji} **${bossName}** respawns <t:${respawnTimestampMin}:R>!`;
      }

      const embed = new EmbedBuilder()
        .setDescription(respawnText)
        .setColor(0xFF6B6B);

      const killButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`kill_boss_${bossName}`)
            .setLabel('Kill')
            .setStyle(ButtonStyle.Danger)
        );

      const guild = channel.guild;
      const role = await getOrCreateNotificationRole(guild);
      const mention = role ? `${role}` : '';

      await channel.send({
        content: mention,
        embeds: [embed],
        components: [killButton]
      });
    }

    if (!hasRange) {
      bossTimers.delete(timerKey);
      await removeBossFromDatabase(timerKey);
    }
  }, reminderDelay);

  let cleanupTimeoutId = null;
  if (hasRange) {
    cleanupTimeoutId = setTimeout(async () => {
      bossTimers.delete(timerKey);
      await removeBossFromDatabase(timerKey);
    }, Math.max(0, timeUntilRespawnMax));
  }

  const bossData = {
    bossName,
    deathTime,
    respawnTimeMin,
    respawnTimeMax,
    reminderTimeout: reminderTimeoutId,
    cleanupTimeout: cleanupTimeoutId,
    channelId,
    guildId
  };

  bossTimers.set(timerKey, bossData);

  if (!skipDatabaseSave) {
    await saveBossToDatabase(timerKey, bossData);
    if (BIG_BOSS_NAMES.has(bossName.toLowerCase())) {
      updateBigBossDashboard(guildId).catch(console.error);
    }
  }
}

async function restoreBossesFromDatabase() {
  console.log('Restoring boss timers from database...');
  const bosses = await loadBossesFromDatabase();
  const now = Date.now();
  let restoredCount = 0;
  let expiredCount = 0;

  for (const { key, data } of bosses) {
    const respawnMin = data.respawnTimeMin || data.respawnTime;
    const respawnMax = data.respawnTimeMax || data.respawnTime;

    if (respawnMax > now) {
      await scheduleBossRespawn(
        data.guildId,
        data.bossName,
        data.deathTime,
        respawnMin,
        respawnMax,
        data.channelId,
        true
      );
      restoredCount++;
    } else {
      await removeBossFromDatabase(key);
      expiredCount++;
    }
  }

  console.log(`Restored ${restoredCount} boss timers, removed ${expiredCount} expired timers`);

  const guildIds = new Set(bosses.map(({ data }) => data.guildId).filter(Boolean));
  for (const guildId of guildIds) {
    updateBigBossDashboard(guildId).catch(console.error);
  }
}

async function restoreRaidSignups() {
  console.log('Restoring raid signups from database...');
  const signups = await loadRaidSignups();
  let restoredCount = 0;
  let updatedCount = 0;

  for (const { key, data } of signups) {
    const raidKey = key.replace('raid:', '');
    raidSignups.set(raidKey, data);
    restoredCount++;

    const parts = raidKey.split('_');
    if (parts.length === 2) {
      const guildId = parts[0];
      const messageId = parts[1];

      try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(data.channelId);
        if (channel && channel.isTextBased()) {
          const message = await channel.messages.fetch(messageId);
          const embed = createRaidEmbed(data.name, data.roles, guildId);
          const buttons = createRaidButtons();
          await message.edit({ embeds: [embed], components: buttons });
          updatedCount++;
        }
      } catch (error) {
        console.log(`Failed to update raid message ${raidKey}:`, error.message);
      }
    }
  }

  console.log(`Restored ${restoredCount} raid signups, updated ${updatedCount} Discord messages`);
}

const SLASH_COMMANDS = [
  new SlashCommandBuilder()
    .setName('tomb')
    .setDescription('Log a boss death at a specific UTC time')
    .addStringOption(option =>
      option.setName('boss_name')
        .setDescription('Name of the boss')
        .setRequired(true)
        .setAutocomplete(true))
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Death time in UTC (HH:MM format, e.g., 14:30)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Log a boss death right now')
    .addStringOption(option =>
      option.setName('boss_name')
        .setDescription('Name of the boss')
        .setRequired(true)
        .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('timers')
    .setDescription('Show all active boss timers'),

  new SlashCommandBuilder()
    .setName('untimed')
    .setDescription('Show bosses that are not currently being tracked'),

  new SlashCommandBuilder()
    .setName('notify')
    .setDescription('Toggle boss respawn notifications on/off'),

  new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Create a raid signup sheet')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the raid')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a boss from tracking (useful for fixing input errors)')
    .addStringOption(option =>
      option.setName('boss_name')
        .setDescription('Name of the boss to remove')
        .setRequired(true)
        .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('restore')
    .setDescription('Bulk restore boss timers by pasting a /timers list'),

  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Fix a boss name that was logged with a typo')
    .addStringOption(option =>
      option.setName('wrong_name')
        .setDescription('The incorrectly spelled name currently being tracked')
        .setRequired(true)
        .setAutocomplete(true))
    .addStringOption(option =>
      option.setName('correct_name')
        .setDescription('The correct boss name')
        .setRequired(true)
        .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('stay')
    .setDescription('Lock respawn announcements to this channel for the whole server'),

  new SlashCommandBuilder()
    .setName('bigbosschannel')
    .setDescription('Set this channel as the big boss timer dashboard')
];

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  await restoreBossesFromDatabase();
  await restoreRaidSignups();

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('Registering slash commands...');

    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: SLASH_COMMANDS }
      );
      console.log(`Commands registered for guild: ${guild.name}`);
    }

    console.log('Successfully registered all commands!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isAutocomplete()) {
    const { commandName, options } = interaction;
    const focusedOption = options.getFocused(true);

    const focusedValue = focusedOption.value.toLowerCase();
    let choices = [];

    if (focusedOption.name === 'boss_name' || focusedOption.name === 'wrong_name') {
      if (commandName === 'remove' || focusedOption.name === 'wrong_name') {
        choices = Array.from(bossTimers.entries())
          .filter(([key]) => key.startsWith(`${interaction.guildId}:`))
          .map(([, timer]) => timer.bossName);
      } else {
        choices = BOSS_LIST;
      }
    } else if (focusedOption.name === 'correct_name') {
      choices = BOSS_LIST;
    }

    const filtered = choices
      .filter(boss => boss.toLowerCase().includes(focusedValue))
      .slice(0, 25);

    await interaction.respond(
      filtered.map(boss => ({ name: boss, value: boss }))
    );
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('raid_')) {
      const action = interaction.customId.replace('raid_', '');
      const raidKey = createRaidKey(interaction.guildId, interaction.message.id);
      const signupData = raidSignups.get(raidKey);

      if (!signupData) {
        await interaction.reply({
          content: '\u274C This raid signup is no longer active.',
          ephemeral: true
        });
        return;
      }

      if (action === 'Bump') {
        const oldMessage = interaction.message;
        const embed = createRaidEmbed(signupData.name, signupData.roles, interaction.guildId);
        const buttons = createRaidButtons();

        const newMessage = await interaction.channel.send({
          embeds: [embed],
          components: buttons
        });

        const oldStorageKey = `raid:${raidKey}`;
        removeRaidSignup(oldStorageKey);
        raidSignups.delete(raidKey);

        const newRaidKey = createRaidKey(interaction.guildId, newMessage.id);
        signupData.messageId = newMessage.id;
        raidSignups.set(newRaidKey, signupData);
        saveRaidSignup(`raid:${newRaidKey}`, signupData);

        try {
          await oldMessage.delete();
        } catch (error) {
          console.log('Failed to delete old raid message:', error.message);
        }

        await interaction.reply({
          content: '\u2705 Raid signup bumped.',
          ephemeral: true
        });

      } else if (RAID_ROLES.includes(action)) {
        const userId = interaction.user.id;
        const userName = interaction.member.displayName;

        // Check if this user is already signed up somewhere
        const alreadySignedUp = RAID_ROLES.some(r =>
          (signupData.roles[r] || []).some(p => p.id === userId)
        );

        if (!alreadySignedUp) {
          // New signup — check if raid is already full (12 players)
          const currentTotal = getAllSignedUpPlayers(signupData.roles).length;
          if (currentTotal >= RAID_MAX_PLAYERS) {
            await interaction.reply({
              content: `\u274C The raid is full (${RAID_MAX_PLAYERS}/${RAID_MAX_PLAYERS} players). You cannot join at this time.`,
              ephemeral: true
            });
            return;
          }
        }

        // Remove from any existing role slot first
        RAID_ROLES.forEach(r => {
          signupData.roles[r] = (signupData.roles[r] || []).filter(p => p.id !== userId);
        });

        const currentPlayers = signupData.roles[action] || [];
        const existingIndex = currentPlayers.findIndex(p => p.id === userId);

        if (existingIndex !== -1) {
          // Player clicked their current role — unsign them
          currentPlayers.splice(existingIndex, 1);
          signupData.roles[action] = currentPlayers;
        } else {
          // Add to new role
          signupData.roles[action] = currentPlayers;
          signupData.roles[action].push({ id: userId, name: userName });
        }

        raidSignups.set(raidKey, signupData);
        saveRaidSignup(`raid:${raidKey}`, signupData);

        const embed = createRaidEmbed(signupData.name, signupData.roles, interaction.guildId);
        await interaction.update({ embeds: [embed] });
      }

    } else if (interaction.customId.startsWith('secondaryRole_')) {
      const parts = interaction.customId.split('_');
      const signupMessageId = parts[1];
      const role = parts.slice(2).join('_');
      const userId = interaction.user.id;
      const guildId = interaction.guildId;

      let currentSecondary = loadSecondaryRoles(guildId, userId);

      if (currentSecondary.includes(role)) {
        currentSecondary = currentSecondary.filter(r => r !== role);
      } else {
        currentSecondary.push(role);
      }

      saveSecondaryRoles(guildId, userId, currentSecondary);

      const embed = new EmbedBuilder()
        .setTitle('Your Secondary Roles')
        .setDescription('Select roles you can also play. These will show as emojis next to your name on the signup sheet.')
        .setColor(0x00AE86);

      const currentDisplay = currentSecondary.length > 0
        ? currentSecondary.map(r => `${RAID_ROLE_EMOJIS[r] || ''} ${r}`).join(', ')
        : 'None';
      embed.addFields({ name: 'Currently selected', value: currentDisplay });

      const row1 = new ActionRowBuilder();
      const row2 = new ActionRowBuilder();

      RAID_ROLES.forEach((roleItem, index) => {
        const isSelected = currentSecondary.includes(roleItem);
        const button = new ButtonBuilder()
          .setCustomId(`secondaryRole_${signupMessageId}_${roleItem}`)
          .setLabel(`${RAID_ROLE_EMOJIS[roleItem]} ${roleItem}`)
          .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary);
        if (index < 5) {
          row1.addComponents(button);
        } else {
          row2.addComponents(button);
        }
      });

      await interaction.update({
        embeds: [embed],
        components: [row1, row2]
      });

      for (const [raidKey, signupData] of raidSignups.entries()) {
        if (!raidKey.startsWith(guildId)) continue;

        let userInSignup = false;
        RAID_ROLES.forEach(r => {
          if ((signupData.roles[r] || []).some(p => p.id === userId)) {
            userInSignup = true;
          }
        });

        if (userInSignup) {
          try {
            const channel = await client.channels.fetch(signupData.channelId);
            const message = await channel.messages.fetch(signupData.messageId);
            const updatedEmbed = createRaidEmbed(signupData.name, signupData.roles, guildId);
            await message.edit({ embeds: [updatedEmbed] });
          } catch (error) {
            console.log('Failed to update raid signup after secondary role change:', error.message);
          }
        }
      }

    } else if (interaction.customId.startsWith('kill_boss_')) {
      const bossName = interaction.customId.replace('kill_boss_', '');
      const deathTime = new Date();
      const respawnConfig = getBossRespawnTimes(bossName);
      const respawnTimeMin = new Date(deathTime.getTime() + respawnConfig.minMs);
      const respawnTimeMax = new Date(deathTime.getTime() + respawnConfig.maxMs);

      await scheduleBossRespawn(interaction.guildId, bossName, deathTime.getTime(), respawnTimeMin.getTime(), respawnTimeMax.getTime(), interaction.channelId);

      const embed = createStatusEmbed(interaction.guildId);
      await interaction.reply({ embeds: [embed] });
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'restore_timers_modal') {
      const timerListText = interaction.fields.getTextInputValue('timer_list_input');
      const lines = timerListText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      const bossNames = [];
      const times = [];

      const columnHeaders = ['boss', 'died at', 'respawns', 'respawn'];
      const bossRegex = /^(?:[\p{Emoji}\uFE0F\u200D]+\s*)?(?:\*\*)?([A-Za-z\s\-']+?)(?:\*\*)?$/u;
      const timeRegex = /^(\d{2}:\d{2})\s*UTC$/;
      const oldFormatRegex = /^(?:[\p{Emoji}\uFE0F\u200D]+\s*)?(?:\*\*)?(.+?)(?:\*\*)? died at (\d{2}:\d{2}) UTC/u;

      for (const line of lines) {
        const oldMatch = line.match(oldFormatRegex);
        if (oldMatch) {
          bossNames.push(oldMatch[1].trim());
          times.push(oldMatch[2]);
          continue;
        }

        const bossMatch = line.match(bossRegex);
        if (bossMatch) {
          const name = bossMatch[1].trim();
          const lowerName = name.toLowerCase();
          if (name.length > 0 && name.length < 30 && !columnHeaders.includes(lowerName)) {
            bossNames.push(name);
          }
          continue;
        }

        const timeMatch = line.match(timeRegex);
        if (timeMatch) {
          times.push(timeMatch[1]);
          continue;
        }
      }

      const successes = [];
      const errors = [];

      const pairCount = Math.min(bossNames.length, times.length);

      for (let i = 0; i < pairCount; i++) {
        const rawBossName = bossNames[i];
        const bossName = normalizeBossName(rawBossName);

        if (!BOSS_LIST.some(b => b.toLowerCase() === bossName.toLowerCase())) {
          await interaction.reply({
            content: `❌ Unknown boss "${bossName}". Use the autocomplete suggestions.`,
            ephemeral: true
          });
          return;
        }
        const timeStr = times[i];

        const deathTime = parseUTCTime(timeStr);
        if (!deathTime) {
          errors.push(`Invalid time for ${bossName}: ${timeStr}`);
          continue;
        }

        const respawnConfig = getBossRespawnTimes(bossName);
        const respawnTimeMin = new Date(deathTime.getTime() + respawnConfig.minMs);
        const respawnTimeMax = new Date(deathTime.getTime() + respawnConfig.maxMs);

        if (respawnTimeMax.getTime() <= Date.now()) {
          errors.push(`${bossName} already respawned (died at ${timeStr} UTC)`);
          continue;
        }

        await scheduleBossRespawn(interaction.guildId, bossName, deathTime.getTime(), respawnTimeMin.getTime(), respawnTimeMax.getTime(), interaction.channelId);
        successes.push(bossName);
      }

      if (bossNames.length !== times.length && pairCount > 0) {
        errors.push(`Found ${bossNames.length} boss names but ${times.length} times - some may not have been restored`);
      }

      let response = '';
      if (successes.length > 0) {
        response += `\u2705 Restored ${successes.length} boss${successes.length !== 1 ? 'es' : ''}: ${successes.join(', ')}\n`;
      }
      if (errors.length > 0) {
        response += `\n\u26A0\uFE0F ${errors.length} issue${errors.length !== 1 ? 's' : ''}:\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          response += `\n...and ${errors.length - 5} more`;
        }
      }

      if (successes.length === 0 && errors.length === 0) {
        response = '\u274C No valid timer entries found in the pasted text.';
      }

      if (successes.length > 0) {
        updateBigBossDashboard(interaction.guildId).catch(console.error);
      }

      await interaction.reply({ content: response, ephemeral: true });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'tomb') {
    const rawBossName = interaction.options.getString('boss_name');
    const bossName = normalizeBossName(rawBossName);

    if (!BOSS_LIST.some(b => b.toLowerCase() === bossName.toLowerCase())) {
      await interaction.reply({
        content: `❌ Unknown boss "${bossName}". Use the autocomplete suggestions.`,
        ephemeral: true
      });
      return;
    }
    const timeStr = interaction.options.getString('time');

    const deathTime = parseUTCTime(timeStr);

    if (!deathTime) {
      await interaction.reply({
        content: '\u274C Invalid time format! Please use HH:MM format (e.g., 14:30)',
        ephemeral: true
      });
      return;
    }

    const respawnConfig = getBossRespawnTimes(bossName);
    const respawnTimeMin = new Date(deathTime.getTime() + respawnConfig.minMs);
    const respawnTimeMax = new Date(deathTime.getTime() + respawnConfig.maxMs);

    await scheduleBossRespawn(interaction.guildId, bossName, deathTime.getTime(), respawnTimeMin.getTime(), respawnTimeMax.getTime(), interaction.channelId);

    const embed = createStatusEmbed(interaction.guildId);
    await interaction.reply({ embeds: [embed] });

  } else if (commandName === 'kill') {
    const rawBossName = interaction.options.getString('boss_name');
    const bossName = normalizeBossName(rawBossName);

    if (!BOSS_LIST.some(b => b.toLowerCase() === bossName.toLowerCase())) {
      await interaction.reply({
        content: `❌ Unknown boss "${bossName}". Use the autocomplete suggestions.`,
        ephemeral: true
      });
      return;
    }
    const deathTime = new Date();
    const respawnConfig = getBossRespawnTimes(bossName);
    const respawnTimeMin = new Date(deathTime.getTime() + respawnConfig.minMs);
    const respawnTimeMax = new Date(deathTime.getTime() + respawnConfig.maxMs);

    await scheduleBossRespawn(interaction.guildId, bossName, deathTime.getTime(), respawnTimeMin.getTime(), respawnTimeMax.getTime(), interaction.channelId);

    const embed = createStatusEmbed(interaction.guildId);
    await interaction.reply({ embeds: [embed] });

  } else if (commandName === 'timers') {
    const embed = createStatusEmbed(interaction.guildId);
    await interaction.reply({ embeds: [embed] });

  } else if (commandName === 'untimed') {
    const trackedBosses = Array.from(bossTimers.entries())
      .filter(([key]) => key.startsWith(`${interaction.guildId}:`))
      .map(([, timer]) => timer.bossName.toLowerCase());

    const untimedBosses = BOSS_LIST.filter(boss =>
      !trackedBosses.includes(boss.toLowerCase())
    );

    const embed = new EmbedBuilder()
      .setTitle('\u{1F513} Untracked Bosses')
      .setColor(0x95A5A6);

    if (untimedBosses.length === 0) {
      embed.setDescription('All bosses are currently being tracked! \u{1F3AF}');
    } else {
      embed.setDescription(untimedBosses.map(boss => {
        const emoji = BIGBOSS_EMOJIS[boss] || '';
        return emoji ? `\u2022 ${emoji} ${boss}` : `\u2022 ${boss}`;
      }).join('\n'));
      embed.setFooter({ text: `${untimedBosses.length} boss${untimedBosses.length !== 1 ? 'es' : ''} available to track` });
    }

    await interaction.reply({ embeds: [embed] });

  } else if (commandName === 'notify') {
    const guild = interaction.guild;
    const member = interaction.member;

    const role = await getOrCreateNotificationRole(guild);

    if (!role) {
      await interaction.reply({
        content: '\u274C Unable to create or find the notification role. Please check bot permissions.',
        ephemeral: true
      });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
      if (hasRole) {
        await member.roles.remove(role);
        await interaction.reply({
          content: '\u{1F515} You will no longer be pinged for boss respawns.',
          ephemeral: true
        });
      } else {
        await member.roles.add(role);
        await interaction.reply({
          content: '\u2705 You\'ll now get pinged when bosses respawn!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error toggling notification role:', error);
      await interaction.reply({
        content: '\u274C Failed to toggle notifications. Make sure the bot has permission to manage roles.',
        ephemeral: true
      });
    }

  } else if (commandName === 'raid') {
    const name = interaction.options.getString('name');

    const roles = {};
    RAID_ROLES.forEach(role => {
      roles[role] = [];
    });

    const embed = createRaidEmbed(name, roles, interaction.guildId);
    const buttons = createRaidButtons();

    // Send the reply and get the Message object back via fetchReply
    const replyMessage = await interaction.reply({
      embeds: [embed],
      components: buttons,
      fetchReply: true
    });

    const raidKey = createRaidKey(interaction.guildId, replyMessage.id);
    const signupData = {
      name,
      roles,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      messageId: replyMessage.id,
      createdAt: Date.now()
    };

    raidSignups.set(raidKey, signupData);
    saveRaidSignup(`raid:${raidKey}`, signupData);

    // Cleanup old raids (keep max 10 per guild)
    const guildRaidKeys = Array.from(raidSignups.entries())
      .filter(([k, v]) => v.guildId === interaction.guildId)
      .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));

    if (guildRaidKeys.length > 10) {
      const toRemove = guildRaidKeys.slice(0, guildRaidKeys.length - 10);
      for (const [oldKey, oldData] of toRemove) {
        try {
          const channel = await client.channels.fetch(oldData.channelId);
          const oldMsg = await channel.messages.fetch(oldData.messageId);
          await oldMsg.delete();
        } catch (error) {
          console.log('Failed to delete old raid message during cleanup:', error.message);
        }
        raidSignups.delete(oldKey);
        removeRaidSignup(`raid:${oldKey}`);
      }
    }

  } else if (commandName === 'remove') {
    const bossName = interaction.options.getString('boss_name');
    const timerKey = createTimerKey(interaction.guildId, bossName);

    if (!bossTimers.has(timerKey)) {
      await interaction.reply({
        content: `\u274C Boss "${bossName}" is not being tracked.`,
        ephemeral: true
      });
      return;
    }

    const timerData = bossTimers.get(timerKey);
    if (timerData.reminderTimeout) clearTimeout(timerData.reminderTimeout);
    if (timerData.cleanupTimeout) clearTimeout(timerData.cleanupTimeout);
    if (timerData.timeout) clearTimeout(timerData.timeout);
    bossTimers.delete(timerKey);
    await removeBossFromDatabase(timerKey);

    if (BIG_BOSS_NAMES.has(bossName.toLowerCase())) {
      updateBigBossDashboard(interaction.guildId).catch(console.error);
    }

    await interaction.reply({
      content: `<:salute:1438508567916449942> Removed **${bossName}** from tracking.`
    });

  } else if (commandName === 'restore') {
    const modal = new ModalBuilder()
      .setCustomId('restore_timers_modal')
      .setTitle('Restore Boss Timers');

    const timerListInput = new TextInputBuilder()
      .setCustomId('timer_list_input')
      .setLabel('Paste your /timers list here')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('\u{1F3F4}\u200D\u2620\uFE0F **Drake**\n**Gryphon**\n12:00 UTC\n11:30 UTC')
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(timerListInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);

  } else if (commandName === 'rename') {
    const wrongName = interaction.options.getString('wrong_name');
    const correctName = interaction.options.getString('correct_name');
    const oldKey = createTimerKey(interaction.guildId, wrongName);

    if (!bossTimers.has(oldKey)) {
      await interaction.reply({
        content: `\u274C **${wrongName}** is not currently being tracked.`,
        ephemeral: true
      });
      return;
    }

    const timerData = bossTimers.get(oldKey);
    if (timerData.reminderTimeout) clearTimeout(timerData.reminderTimeout);
    if (timerData.cleanupTimeout) clearTimeout(timerData.cleanupTimeout);
    if (timerData.timeout) clearTimeout(timerData.timeout);
    bossTimers.delete(oldKey);
    await removeBossFromDatabase(oldKey);

    await scheduleBossRespawn(
      interaction.guildId,
      correctName,
      timerData.deathTime,
      timerData.respawnTimeMin,
      timerData.respawnTimeMax,
      timerData.channelId
    );

    if (BIG_BOSS_NAMES.has(wrongName.toLowerCase()) && !BIG_BOSS_NAMES.has(correctName.toLowerCase())) {
      updateBigBossDashboard(interaction.guildId).catch(console.error);
    }

    await interaction.reply({
      content: `<:salute:1438508567916449942> Renamed **${wrongName}** \u2192 **${correctName}**. Timer continues unchanged.`,
      ephemeral: true
    });

  } else if (commandName === 'stay') {
    saveHomeChannel(interaction.guildId, interaction.channelId);
    await interaction.reply({
      content: `<:salute:1438508567916449942> Got it! All respawn announcements for this server will now be sent to <#${interaction.channelId}>.`
    });

  } else if (commandName === 'bigbosschannel') {
    const embed = createBigBossEmbed(interaction.guildId);
    const msg = await interaction.channel.send({ embeds: [embed] });
    saveBigBossChannel(interaction.guildId, interaction.channelId, msg.id);
    await interaction.reply({
      content: `<:salute:1438508567916449942> Big boss dashboard set to this channel.`,
      ephemeral: true
    });
  }
});

client.on('guildCreate', async guild => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guild.id),
      { body: SLASH_COMMANDS }
    );
    console.log(`Commands registered for new guild: ${guild.name}`);
  } catch (error) {
    console.error('Error registering commands for new guild:', error);
  }
});

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN environment variable is not set!');
  console.log('\nTo set up your Discord bot:');
  console.log('1. Go to https://discord.com/developers/applications');
  console.log('2. Create a new application or select an existing one');
  console.log('3. Go to the "Bot" section and create a bot');
  console.log('4. Copy the bot token');
  console.log('5. Add DISCORD_BOT_TOKEN to your .env file');
  process.exit(1);
} else {
  client.login(process.env.DISCORD_BOT_TOKEN);
}
