const PRINTING_OPTIONS = ['1st Edition', 'Unlimited', 'Limited Edition'];
const CONDITION_OPTIONS = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];
const SET_CODE_REGEX = /\b(?=[A-Z0-9-]*\d)[A-Z0-9]{2,}-[A-Z0-9-]+\b/i;
const CSV_FIELD_REGEX = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
const LEADING_QUANTITY_REGEX = /^\s*(\d+)\s+(.+)$/;

export const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const toCanonicalLookup = (value) => normalizeWhitespace(value).toLowerCase();

const findCanonicalOption = (value, options) => {
  const normalized = toCanonicalLookup(value);
  return options.find((option) => toCanonicalLookup(option) === normalized) || value;
};

const splitCsvLine = (line) => {
  const matches = [];
  let match;
  CSV_FIELD_REGEX.lastIndex = 0;

  while ((match = CSV_FIELD_REGEX.exec(line)) !== null) {
    matches.push((match[1] || match[2] || '').trim());
  }

  return matches.map((value) => value.replace(/""/g, '"').trim());
};

const includesLoose = (left, right) =>
  (left ?? '')
    .toString()
    .toLowerCase()
    .includes((right ?? '').toString().toLowerCase());

export const withPrintingInCondition = (condition, printing) => {
  const normalizedCondition = normalizeWhitespace(condition || '');
  const normalizedPrinting = normalizeWhitespace(printing || '');

  if (!normalizedCondition || !normalizedPrinting) {
    return normalizedCondition;
  }

  if (includesLoose(normalizedCondition, normalizedPrinting)) {
    return normalizedCondition;
  }

  return `${normalizedCondition} ${normalizedPrinting}`;
};

const extractLeadingQuantity = (value) => {
  const normalized = normalizeWhitespace(value || '');
  const match = normalized.match(LEADING_QUANTITY_REGEX);

  if (!match) {
    return { quantity: 1, value: normalized };
  }

  const quantity = Number.parseInt(match[1], 10);
  const remainingValue = normalizeWhitespace(match[2] || '');

  if (!Number.isFinite(quantity) || quantity < 1 || !remainingValue) {
    return { quantity: 1, value: normalized };
  }

  return { quantity, value: remainingValue };
};

const parseQuantityField = (value) => {
  const normalized = normalizeWhitespace(value || '');
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const quantity = Number.parseInt(normalized, 10);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
};

const parseFreeformLine = (line, knownSetNames) => {
  const { quantity, value } = extractLeadingQuantity(line);
  const normalizedLine = normalizeWhitespace(value);
  if (!normalizedLine) return null;

  const setCodeMatch = normalizedLine.match(SET_CODE_REGEX);
  if (!setCodeMatch?.[0]) {
    return null;
  }

  const number = setCodeMatch[0];
  const numberStart = setCodeMatch.index ?? 0;
  const beforeNumber = normalizeWhitespace(normalizedLine.slice(0, numberStart));
  let afterNumber = normalizeWhitespace(normalizedLine.slice(numberStart + number.length));

  if (!beforeNumber || !afterNumber) {
    return null;
  }

  const sortedSetNames = [...knownSetNames].sort((a, b) => b.length - a.length);
  const beforeLower = toCanonicalLookup(beforeNumber);
  const matchedSetName = sortedSetNames.find((setName) =>
    beforeLower.endsWith(toCanonicalLookup(setName)),
  );

  if (!matchedSetName) {
    return null;
  }

  const productName = normalizeWhitespace(
    beforeNumber.slice(0, beforeNumber.length - matchedSetName.length),
  );
  if (!productName) {
    return null;
  }

  let printing = '';
  const matchedPrinting = PRINTING_OPTIONS.find((option) =>
    toCanonicalLookup(afterNumber).startsWith(toCanonicalLookup(option)),
  );
  if (matchedPrinting) {
    printing = matchedPrinting;
    afterNumber = normalizeWhitespace(afterNumber.slice(matchedPrinting.length));
  }

  const conditionRegex = new RegExp(
    `(${CONDITION_OPTIONS.map((option) => option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})` +
      `(?:\\s+(${PRINTING_OPTIONS.map((option) => option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))?$`,
    'i',
  );

  let rarity;
  let condition = '';
  const conditionMatch = afterNumber.match(conditionRegex);
  if (conditionMatch) {
    const baseCondition = findCanonicalOption(conditionMatch[1], CONDITION_OPTIONS);
    const conditionPrinting = conditionMatch[2]
      ? findCanonicalOption(conditionMatch[2], PRINTING_OPTIONS)
      : '';

    const conditionStart = conditionMatch.index ?? afterNumber.length;
    rarity = normalizeWhitespace(afterNumber.slice(0, conditionStart));
    condition = conditionPrinting ? `${baseCondition} ${conditionPrinting}` : baseCondition;

    if (!printing && conditionPrinting) {
      printing = conditionPrinting;
    }
  } else {
    rarity = afterNumber;
  }

  return {
    productName,
    setName: matchedSetName,
    number,
    printing,
    rarity,
    condition,
    quantity,
  };
};

export const parseCardLine = (line, knownSetNames) => {
  const normalizedLine = normalizeWhitespace(line);
  if (!normalizedLine) return null;

  if (normalizedLine.includes(',')) {
    const fields = splitCsvLine(normalizedLine);
    const firstFieldQuantity = parseQuantityField(fields[0]);

    if (firstFieldQuantity && fields.length >= 7) {
      const [, rawProductName, setName, number, printing, rarity, condition] = fields;
      return {
        productName: rawProductName,
        setName,
        number,
        printing,
        rarity,
        condition,
        quantity: firstFieldQuantity,
      };
    }

    if (fields.length >= 6) {
      const [rawProductName, setName, number, printing, rarity, condition] = fields;
      const { quantity, value: productName } = extractLeadingQuantity(rawProductName);
      return {
        productName,
        setName,
        number,
        printing,
        rarity,
        condition,
        quantity,
      };
    }
  }

  return parseFreeformLine(normalizedLine, knownSetNames);
};
