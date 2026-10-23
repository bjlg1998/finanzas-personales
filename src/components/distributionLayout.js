function legendColumns(width, fontScale = 1) {
  return Math.max(1, Math.min(3, Math.floor((Math.max(0, width) + 12) / (140 * Math.max(1, fontScale) + 12))));
}
module.exports = {
  legendColumns
};
