export const unwrapData = (response) => response?.data?.data ?? response?.data ?? response;

export const unwrapList = (response) => {
  const payload = response?.data ?? response;
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(payload)) return payload;

  return [];
};

export const unwrapResource = (response, key) => {
  const data = unwrapData(response);
  if (key && data && typeof data === 'object' && key in data) return data[key];
  return data ?? null;
};

export const unwrapPagination = (response) => response?.data?.pagination ?? response?.pagination ?? null;

export const unwrapMessage = (response) => response?.data?.message ?? response?.message ?? '';

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const payload = error?.response?.data;

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors.map((err) => err.message).filter(Boolean).join('\n');
  }

  return payload?.message || error?.message || fallback;
};
