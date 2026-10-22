const test = require('node:test');
const assert = require('node:assert/strict');
const { mapOpenverse, mapCommons } = require('../js/images.js');

test('openverse keeps https images and strips markup from attribution', () => {
  const rows = mapOpenverse({
    results: [
      { url: 'http://insecure.example/a.jpg', title: 'skip' },
      {
        url: 'https://cdn.example/a.jpg',
        thumbnail: 'https://cdn.example/t.jpg',
        title: 'Passport <b>scan</b>',
        creator: 'Ada',
        license: 'by',
        license_version: '4.0',
        license_url: 'https://creativecommons.org/licenses/by/4.0/',
        foreign_landing_url: 'https://example.com/photo',
        attribution: 'Ada, CC BY'
      }
    ]
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, 'openverse');
  assert.equal(rows[0].url, 'https://cdn.example/a.jpg');
  assert.equal(rows[0].title, 'Passport scan');
  assert.equal(rows[0].license, 'by 4.0');
  assert.equal(rows[0].creator, 'Ada');
});

test('commons skips non-images and reads the license name', () => {
  const rows = mapCommons({
    query: {
      pages: {
        1: {
          title: 'File:Gate.jpg',
          imageinfo: [{
            mime: 'image/jpeg',
            thumburl: 'https://upload.wikimedia.org/t.jpg',
            url: 'https://upload.wikimedia.org/a.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Gate.jpg',
            extmetadata: {
              Artist: { value: '<a href="https://example.com">Ada</a>' },
              LicenseShortName: { value: 'CC BY 4.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
              ObjectName: { value: 'Gate' }
            }
          }]
        },
        2: { imageinfo: [{ mime: 'application/pdf', url: 'https://upload.wikimedia.org/a.pdf' }] }
      }
    }
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, 'wikimedia');
  assert.equal(rows[0].creator, 'Ada');
  assert.equal(rows[0].license, 'CC BY 4.0');
  assert.equal(rows[0].title, 'Gate');
});
