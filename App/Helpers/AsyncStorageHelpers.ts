import AsyncStorage from '@react-native-async-storage/async-storage';

// keys
export const TOKEN_KEY = 'auth_token'
export const USE_PRODUCTION_KEY = "use_production"
export const USER_KEY = 'user';


export type StorableValue = string | number | boolean | Record<string, any> | any[];

function isObject(val: any): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isArray(val: any): val is any[] {
  return Array.isArray(val);
}

function getLogValue(key: string, value: any) {
  if (key === TOKEN_KEY) {
    return '<redacted>';
  }
  return value;
}

export async function persistData(key: string, value: StorableValue): Promise<void> {
  let toStore: string;
  if (isArray(value)) {
    // Store array as type 'array', recursively filter out functions from objects inside
    const filteredArray = value.map(item => {
      if (isObject(item)) {
        const plainObj: Record<string, any> = {};
        Object.keys(item).forEach(k => {
          const v = item[k];
          if (typeof v !== 'function') {
            plainObj[k] = v;
          }
        });
        return plainObj;
      }
      return item;
    });
    toStore = JSON.stringify({type: 'array', value: filteredArray});
  } else if (isObject(value)) {
    // Only store own enumerable properties, no functions
    const plainObj: Record<string, any> = {};
    Object.keys(value).forEach(k => {
      const v = value[k];
      if (typeof v !== 'function') {
        plainObj[k] = v;
      }
    });
    toStore = JSON.stringify({type: 'object', value: plainObj});
  } else if (typeof value === 'string') {
    toStore = JSON.stringify({type: 'string', value});
  } else if (typeof value === 'number') {
    toStore = JSON.stringify({type: 'number', value});
  } else if (typeof value === 'boolean') {
    toStore = JSON.stringify({type: 'boolean', value});
  } else {
    throw new Error('persistData error: Unsupported value type');
  }
  await AsyncStorage.setItem(key, toStore);
  console.log(`Persisted data for key "${key}"`, { value: getLogValue(key, value), type: typeof value });
}

export async function retrieveData<T extends StorableValue>(key: string): Promise<T | null> {
  const item = await AsyncStorage.getItem(key);
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    console.log(`Retrieved persisted data for key "${key}"`, { value: getLogValue(key, parsed.value), type: parsed.type });
    if (parsed.type === 'array') return parsed.value as T;
    if (parsed.type === 'object') return parsed.value as T;
    if (parsed.type === 'string') return parsed.value as T;
    if (parsed.type === 'number') return parsed.value as T;
    if (parsed.type === 'boolean') return parsed.value as T;
    return null;
  } catch (e) {
    console.log(`Error retrieving persisted data for key "${key}"`, e);
    return null;
  }
}

export async function removeData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
