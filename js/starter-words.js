(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STARTER = [
    { en: 'airport', ru: 'аэропорт', context: 'I am at the airport.', imageQuery: 'airport terminal' },
    { en: 'ticket', ru: 'билет', context: 'This is my ticket.', imageQuery: 'boarding pass' },
    { en: 'passport', ru: 'паспорт', context: 'Here is my passport.', imageQuery: 'passport' },
    { en: 'flight', ru: 'рейс', context: 'My flight is at nine.', imageQuery: 'airplane departure' },
    { en: 'gate', ru: 'выход на посадку', context: 'The gate is on the left.', imageQuery: 'airport gate' },
    { en: 'hotel', ru: 'отель', context: 'The hotel is near the station.', imageQuery: 'hotel lobby' },
    { en: 'reservation', ru: 'бронь', context: 'I have a reservation.', imageQuery: 'hotel reception desk' },
    { en: 'room', ru: 'номер', context: 'The room is ready.', imageQuery: 'hotel room' },
    { en: 'key', ru: 'ключ', context: 'Can I have the room key?', imageQuery: 'hotel key' },
    { en: 'map', ru: 'карта', context: 'Do you have a map?', imageQuery: 'city map' },
    { en: 'taxi', ru: 'такси', context: 'We need a taxi.', imageQuery: 'taxi cab' },
    { en: 'station', ru: 'станция', context: 'The station is straight ahead.', imageQuery: 'train station' },
    { en: 'left', ru: 'налево', context: 'Turn left.', imageQuery: 'turn left sign' },
    { en: 'right', ru: 'направо', context: 'The cafe is on the right.', imageQuery: 'turn right sign' },
    { en: 'straight', ru: 'прямо', context: 'Go straight.', imageQuery: 'straight road' },
    { en: 'menu', ru: 'меню', context: 'Can I see the menu?', imageQuery: 'restaurant menu' },
    { en: 'coffee', ru: 'кофе', context: 'A coffee, please.', imageQuery: 'cup of coffee' },
    { en: 'water', ru: 'вода', context: 'A glass of water, please.', imageQuery: 'glass of water' },
    { en: 'the check', ru: 'счёт в кафе', context: 'Can I have the check, please?', imageQuery: 'restaurant bill' },
    { en: 'breakfast', ru: 'завтрак', context: 'Breakfast is at eight.', imageQuery: 'breakfast table' },
    { en: 'please', ru: 'пожалуйста', context: 'A coffee, please.', imageQuery: 'cafe counter' },
    { en: 'thank you', ru: 'спасибо', context: 'Thank you.', imageQuery: 'thank you' },
    { en: 'excuse me', ru: 'извините', context: 'Excuse me, where is the station?', imageQuery: 'people talking' },
    { en: 'hello', ru: 'здравствуйте', context: 'Hello, nice to meet you.', imageQuery: 'greeting handshake' },
    { en: 'nice to meet you', ru: 'приятно познакомиться', context: 'Nice to meet you.', imageQuery: 'meeting people' },
    { en: 'friend', ru: 'друг', context: 'She is my friend.', imageQuery: 'friends talking' },
    { en: 'message', ru: 'сообщение', context: 'I sent you a message.', imageQuery: 'text message phone' },
    { en: 'see you', ru: 'увидимся', context: 'See you later.', imageQuery: 'waving goodbye' },
    { en: 'late', ru: 'опаздываю', context: 'Am I late?', imageQuery: 'clock' },
    { en: 'help', ru: 'помощь', context: 'Can you help me?', imageQuery: 'asking for help' }
  ];

  return { STARTER: STARTER };
});
