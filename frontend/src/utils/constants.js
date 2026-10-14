export const ACTIVITIES = [
  { key: 'cuddle', label: 'Cuddles & Support', short: 'Cuddle therapy', emoji: '🤱', tone: 'peach' },
  { key: 'tummy_time', label: 'Tummy Time', short: 'Tummy time', emoji: '👶', tone: 'yellow' },
  { key: 'play', label: 'Play & Learn', short: 'Play & learn', emoji: '🧩', tone: 'blue' },
  { key: 'feeding', label: 'Feeding Support', short: 'Feeding support', emoji: '🍼', tone: 'green' },
];

export const SUPPLY_CATEGORIES = [
  {
    key: 'nappies',
    label: 'Nappies',
    emoji: '🧷',
    groups: [{ key: 'size', label: 'Size', choices: ['1', '2', '3', '4', '5', '+6'], compact: true }],
    units: ['Packs', 'Boxes'],
  },
  {
    key: 'wet_wipes',
    label: 'Wet wipes',
    emoji: '🧻',
    groups: [{ key: 'type', label: 'Type', choices: ['Sensitive', 'Fragrance Free', 'Regular'] }],
    units: ['Packs', 'Boxes'],
  },
  {
    key: 'toys',
    label: 'Toys',
    emoji: '🧸',
    groups: [
      { key: 'age', label: 'Age', choices: ['0-3 m', '3-6 m', '12-24m'] },
      { key: 'type', label: 'Type', choices: ['Soft toys', 'Blocks', 'Books'] },
    ],
    units: [],
  },
  {
    key: 'formula',
    label: 'Formula',
    emoji: '🥫',
    groups: [
      { key: 'stage', label: 'Stage', choices: ['1', '2', '3'], compact: true },
      { key: 'type', label: 'Type', choices: ['Standard', 'Lactose free', 'Anti-reflux'] },
    ],
    units: ['Tins', 'Boxes'],
  },
];

export const URGENCY = [
  { key: 'today', label: 'Today', color: '#e53935' },
  { key: 'this_week', label: 'This week', color: '#fb8c00' },
  { key: 'stock_up', label: 'Stock Up', color: '#43a047' },
];

export const REQUEST_STATUS = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'fulfilled', label: 'Fulfilled' },
];

export const STAFF_ROLES = [
  { key: 'nursery_caregiver', label: 'Nursery caregiver' },
  { key: 'volunteer_coordinator', label: 'Volunteer coordinator' },
  { key: 'administrator', label: 'Administrator' },
];

export const ROLE_LABELS = {
  volunteer: 'Volunteer',
  nursery_caregiver: 'Nursery caregiver',
  volunteer_coordinator: 'Volunteer coordinator',
  administrator: 'Administrator',
};

export function supplyEmoji(category) {
  const match = SUPPLY_CATEGORIES.find((item) => item.key === category);

  return match ? match.emoji : '📦';
}
