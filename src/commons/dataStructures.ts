/**
 * Utility methods for data structures
 */

export function flipMap(obj) {
    const ret = {};
    for (const item in obj) {
        ret[obj[item]] = item;
    }
    return ret;
}

export function flipNested(obj) {
    const ret = {};
    for (const nested in obj) {
        ret[nested] = flipMap(obj[nested]);
    }
    return ret;
}

export function toUTF8String(data) {
  const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
  const count = data.length;
  let str = "";
  
  for (let index = 0;index < count;)
  {
    let ch = data[index++];
    if (ch & 0x80)
    {
      let extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || ((index + extra) > count))
        return null;
      
      ch = ch & (0x3F >> extra);
      for (;extra > 0;extra -= 1)
      {
        const chx = data[index++];
        if ((chx & 0xC0) != 0x80)
          return null;
        
        ch = (ch << 6) | (chx & 0x3F);
      }
    }
    
    str += String.fromCharCode(ch);
  }
  
  return str;
}


export function toUTF8StringRange(stream, cursor, count) {
    const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
    let str = "";
    
    for (let index = cursor;index < cursor+count;)
    {
      let ch = stream[index++];
      if (ch & 0x80)
      {
        let extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || ((index + extra) > cursor+count))
          return null;
        
        ch = ch & (0x3F >> extra);
        for (;extra > 0;extra -= 1)
        {
          const chx = stream[index++];
          if ((chx & 0xC0) != 0x80)
            return null;
          
          ch = (ch << 6) | (chx & 0x3F);
        }
      }
      
      str += String.fromCharCode(ch);
    }
    
    return str;
  }

  export function bufferToArray(buffer){
    if (buffer.length > 0) {
        const data = new Array(buffer.length);
        for (let i = 0; i < buffer.length; i=i+1)
            data[i] = buffer[i];
        return data;
    }
    return [];
}