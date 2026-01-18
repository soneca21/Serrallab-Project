
/**
 * Checks if a date is older than X days
 * @param {Date|string} date 
 * @param {number} days 
 * @returns {boolean}
 */
export const isOlderThan = (date, days) => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - d);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays > days;
};

/**
 * Gets days elapsed since date
 * @param {Date|string} date 
 * @returns {number}
 */
export const getDaysSince = (date) => {
  if (!date) return 0;
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - d);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formats date to BR standard (DD/MM/YYYY)
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatDateBR = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
};

/**
 * Calculates SLA status
 * @param {Date|string} createdAt 
 * @param {number} slaHours 
 * @returns {{ remaining: number, isOverdue: boolean }}
 */
export const calculateSLA = (createdAt, slaHours) => {
  const start = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const limit = start + (slaHours * 60 * 60 * 1000);
  const remaining = limit - now;
  
  return {
    remaining: Math.max(0, remaining), // milliseconds
    isOverdue: remaining < 0
  };
};
