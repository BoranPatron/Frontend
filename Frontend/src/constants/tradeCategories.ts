// Trade Categories - Shared constants for consistent category definitions
// Used in TradeCreationForm, TradeDetailsModal, and ResourceSelectionPanel

export interface TradeCategory {
  value: string;
  label: string;
  icon?: string;
  emoji?: string;
}

export const TRADE_CATEGORIES: TradeCategory[] = [
  { value: 'electrical', label: 'Elektro', emoji: '⚡' },
  { value: 'plumbing', label: 'Sanitär', emoji: '🚿' },
  { value: 'heating', label: 'Heizung', emoji: '🔥' },
  { value: 'flooring', label: 'Bodenbelag', emoji: '🏗️' },
  { value: 'painting', label: 'Malerei', emoji: '🎨' },
  { value: 'carpentry', label: 'Zimmerei', emoji: '🪚' },
  { value: 'roofing', label: 'Dachdeckerei', emoji: '🏠' },
  { value: 'landscaping', label: 'Garten- & Landschaftsbau', emoji: '🌳' },
  { value: 'civil_engineering', label: 'Tiefbau', emoji: '🚧' },
  { value: 'structural', label: 'Hochbau', emoji: '🏗️' },
  { value: 'interior', label: 'Innenausbau / Interior', emoji: '🛋️' },
  { value: 'facade', label: 'Fassade', emoji: '🏢' },
  { value: 'windows_doors', label: 'Fenster & Türen', emoji: '🪟' },
  { value: 'drywall', label: 'Trockenbau', emoji: '🧱' },
  { value: 'tiling', label: 'Fliesenarbeiten', emoji: '🧩' },
  { value: 'insulation', label: 'Dämmung', emoji: '🧊' },
  { value: 'hvac', label: 'Klima / Lüftung (HVAC)', emoji: '🌬️' },
  { value: 'smart_home', label: 'Smart Home', emoji: '📡' },
  { value: 'site_preparation', label: 'Erdarbeiten / Baustellenvorbereitung', emoji: '🚜' },
  { value: 'other', label: 'Sonstiges', emoji: '🔧' }
];

// Helper function to get category label by value
export const getCategoryLabel = (value: string): string => {
  const category = TRADE_CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : value;
};

// Helper function to get all category values
export const getCategoryValues = (): string[] => {
  return TRADE_CATEGORIES.map(cat => cat.value);
};

// Helper function to check if a category value is valid
export const isValidCategory = (value: string): boolean => {
  return TRADE_CATEGORIES.some(cat => cat.value === value);
};

// Helper function to get category label with emoji by value
export const getCategoryLabelWithEmoji = (value: string): string => {
  const category = TRADE_CATEGORIES.find(cat => cat.value === value);
  return category ? `${category.emoji} ${category.label}` : value;
};
