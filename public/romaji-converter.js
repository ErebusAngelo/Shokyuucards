// Sistema de conversión de romaji a hiragana/katakana
class RomajiConverter {
  constructor() {
    // Mapas de conversión para hiragana
    this.hiraganaMap = {
      // Vocales
      'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
      
      // Consonantes K
      'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
      'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
      
      // Consonantes G
      'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
      'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
      
      // Consonantes S
      'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
      'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
      
      // Consonantes Z
      'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
      'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
      
      // Consonantes T
      'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
      'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
      
      // Consonantes D
      'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
      
      // Consonantes N
      'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
      'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
      
      // Consonantes H
      'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
      'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
      
      // Consonantes B
      'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
      'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
      
      // Consonantes P
      'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
      'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
      
      // Consonantes M
      'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
      'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
      
      // Consonantes Y
      'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
      
      // Consonantes R
      'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
      'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
      
      // Consonantes W
      'wa': 'わ', 'wi': 'ゐ', 'we': 'ゑ', 'wo': 'を',
      
      // N especial
      'n': 'ん',
      
      // Variaciones especiales
      'nn': 'ん',
      'n\'': 'ん',
      'xtu': 'っ',
      'xtsu': 'っ',
      'ltu': 'っ',
      'ltsu': 'っ'
    };

    // Mapas de conversión para katakana
    this.katakanaMap = {
      // Vocales
      'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
      
      // Consonantes K
      'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
      'kya': 'キャ', 'kyu': 'キュ', 'kyo': 'キョ',
      
      // Consonantes G
      'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
      'gya': 'ギャ', 'gyu': 'ギュ', 'gyo': 'ギョ',
      
      // Consonantes S
      'sa': 'サ', 'shi': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
      'sha': 'シャ', 'shu': 'シュ', 'sho': 'ショ',
      
      // Consonantes Z
      'za': 'ザ', 'ji': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
      'ja': 'ジャ', 'ju': 'ジュ', 'jo': 'ジョ',
      
      // Consonantes T
      'ta': 'タ', 'chi': 'チ', 'tsu': 'ツ', 'te': 'テ', 'to': 'ト',
      'cha': 'チャ', 'chu': 'チュ', 'cho': 'チョ',
      
      // Consonantes D
      'da': 'ダ', 'di': 'ヂ', 'du': 'ヅ', 'de': 'デ', 'do': 'ド',
      
      // Consonantes N
      'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
      'nya': 'ニャ', 'nyu': 'ニュ', 'nyo': 'ニョ',
      
      // Consonantes H
      'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
      'hya': 'ヒャ', 'hyu': 'ヒュ', 'hyo': 'ヒョ',
      
      // Consonantes B
      'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
      'bya': 'ビャ', 'byu': 'ビュ', 'byo': 'ビョ',
      
      // Consonantes P
      'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
      'pya': 'ピャ', 'pyu': 'ピュ', 'pyo': 'ピョ',
      
      // Consonantes M
      'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
      'mya': 'ミャ', 'myu': 'ミュ', 'myo': 'ミョ',
      
      // Consonantes Y
      'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
      
      // Consonantes R
      'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
      'rya': 'リャ', 'ryu': 'リュ', 'ryo': 'リョ',
      
      // Consonantes W
      'wa': 'ワ', 'wi': 'ヰ', 'we': 'ヱ', 'wo': 'ヲ',
      
      // N especial
      'n': 'ン',
      
      // Variaciones especiales
      'nn': 'ン',
      'n\'': 'ン',
      'xtu': 'ッ',
      'xtsu': 'ッ',
      'ltu': 'ッ',
      'ltsu': 'ッ'
    };
  }

  // Convierte romaji a hiragana o katakana
  convert(romaji, script = 'hiragana') {
    if (!romaji) return '';
    
    const map = script === 'katakana' ? this.katakanaMap : this.hiraganaMap;
    let result = '';
    let input = romaji.toLowerCase().trim();
    
    // Procesar consonantes dobles (っ/ッ)
    input = input.replace(/([kgsztdnhbpmyrw])\1/g, (match, consonant) => {
      const tsu = script === 'katakana' ? 'ッ' : 'っ';
      return tsu + consonant;
    });
    
    let i = 0;
    while (i < input.length) {
      let found = false;
      
      // Intentar coincidencias de 3 caracteres primero
      for (let len = 3; len >= 1; len--) {
        const substr = input.substr(i, len);
        if (map[substr]) {
          result += map[substr];
          i += len;
          found = true;
          break;
        }
      }
      
      // Si no se encuentra coincidencia, agregar el carácter tal como está
      if (!found) {
        result += input[i];
        i++;
      }
    }
    
    return result;
  }

  // Convierte específicamente a hiragana
  toHiragana(romaji) {
    return this.convert(romaji, 'hiragana');
  }

  // Convierte específicamente a katakana
  toKatakana(romaji) {
    return this.convert(romaji, 'katakana');
  }

  // Valida si el input es romaji válido
  isValidRomaji(input) {
    if (!input) return false;
    
    // Patrón básico para romaji válido
    const romajiPattern = /^[a-zA-Z\s\-']+$/;
    return romajiPattern.test(input);
  }

  // Obtiene sugerencias de conversión
  getSuggestions(romaji) {
    const hiragana = this.toHiragana(romaji);
    const katakana = this.toKatakana(romaji);
    
    return {
      hiragana,
      katakana,
      romaji: romaji.toLowerCase()
    };
  }
}

// Crear instancia global
if (typeof window !== 'undefined') {
  window.romajiConverter = new RomajiConverter();
}