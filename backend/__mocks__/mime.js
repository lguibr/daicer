const types = Object.create(null);
const extensions = Object.create(null);

const defineImpl = (map, force = false) => {
  Object.keys(map).forEach((type) => {
    const entries = Array.isArray(map[type]) ? map[type] : [map[type]];
    const lowerType = type.toLowerCase();

    if (force || !types[lowerType]) {
      types[lowerType] = entries[0];
    }

    entries.forEach((ext) => {
      const lowerExt = ext.toLowerCase();
      if (force || !extensions[lowerExt]) {
        extensions[lowerExt] = lowerType;
      }
    });
  });
};

const getExtensionFromPath = (value) => {
  if (!value) return '';
  const stripped = value.split('?')[0].split('#')[0];
  const parts = stripped.split('/');
  const lastPart = parts[parts.length - 1];
  if (!lastPart) return '';
  const dotIndex = lastPart.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === lastPart.length - 1) {
    return '';
  }
  return lastPart.substring(dotIndex + 1);
};

const isMimeType = (value) => typeof value === 'string' && /^[^\s\/]+\/[^\s\/]+$/.test(value);

const lookupImpl = (value) => {
  if (!value) return false;

  const extFromPath = getExtensionFromPath(value);
  if (extFromPath) {
    return extensions[extFromPath.toLowerCase()] || false;
  }

  const lower = value.toLowerCase();
  if (isMimeType(lower)) {
    return lower;
  }

  return extensions[lower] || false;
};

const getTypeImpl = (value) => lookupImpl(value);

const extensionImpl = (type) => {
  if (!type) return false;
  const lower = type.toLowerCase();
  if (isMimeType(lower)) {
    return types[lower] || false;
  }
  return types[extensions[lower]] || false;
};

const charsetLookupImpl = (mimeType) => {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  if (lower.startsWith('text/') || lower === 'application/json' || lower.endsWith('+json')) {
    return 'UTF-8';
  }
  return false;
};

const contentTypeImpl = (value) => {
  if (!value) return false;

  let type = lookupImpl(value) || (isMimeType(value) ? value.toLowerCase() : false);
  if (!type && typeof value === 'string') {
    type = value.toLowerCase();
  }

  if (!type) return false;

  if (/;\s*charset=/i.test(type)) {
    return type;
  }

  const charset = charsetLookupImpl(type);
  if (charset) {
    return `${type}; charset=${charset.toLowerCase()}`;
  }

  return type;
};

const define = jest.fn(defineImpl);
const getType = jest.fn(getTypeImpl);
const lookup = jest.fn(lookupImpl);
const extension = jest.fn(extensionImpl);
const contentType = jest.fn(contentTypeImpl);
const charsetLookup = jest.fn(charsetLookupImpl);

module.exports = {
  define,
  getType,
  lookup,
  extension,
  contentType,
  charsets: {
    lookup: charsetLookup,
  },
  types,
  extensions,
};

