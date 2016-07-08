/* jshint mocha: true */

'use strict';

var assert = require('assert');
var opentype = require('../src/opentype.js');
var Substitution = require('../src/substitution.js');

describe('substitution.js', function() {

    var font;
    var substitution;
    var notdefGlyph = new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        path: new opentype.Path()
    });

    var glyphs = [notdefGlyph].concat('abcdefghijklmnopqrstuvwxyz'.split('').map(function(c) {
        return new opentype.Glyph({
            name: c,
            unicode: c.charCodeAt(0),
            path: new opentype.Path()
        });
    }));

    beforeEach(function() {
        font = new opentype.Font({
            familyName: 'MyFont',
            styleName: 'Medium',
            unitsPerEm: 1000,
            ascender: 800,
            descender: -200,
            glyphs: glyphs
        });
        substitution = new Substitution(font);
    });

    describe('getGsubTable', function() {
        it('must not create an empty default GSUB table', function() {
            assert.equal(substitution.getGsubTable(), undefined);
            assert.equal(substitution.getGsubTable(false), undefined);
        });

        it('can create an empty default GSUB table', function() {
            assert.deepEqual(substitution.getGsubTable(true), {
                version: 1,
                scripts: [{
                    tag: 'DFLT',
                    script: {
                        defaultLangSys: { reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: [] },
                        langSysRecords: []
                    }
                }],
                features: [],
                lookups: []
            });
        });
    });

    describe('add', function() {
        it('can add ligatures (lookup type 4)', function() {
            substitution.add('liga', { sub: [4, 5], by: 17 });
            substitution.add('liga', { sub: [4, 6], by: 18 });
            substitution.add('liga', { sub: [8, 1, 2], by: 19 });
            assert.deepEqual(font.tables.gsub.scripts, [{
                tag: 'DFLT',
                script: {
                    defaultLangSys: { reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: [0] },
                    langSysRecords: []
                }
            }]);
            assert.deepEqual(font.tables.gsub.features, [{
                tag: 'liga',
                feature: { params: 0, lookupListIndexes: [0] }
            }]);
            assert.deepEqual(font.tables.gsub.lookups, [{
                lookupFlag: 0,
                lookupType: 4,
                markFilteringSet: undefined,
                subtables: [{
                    substFormat: 1,
                    coverage: { format: 1, glyphs: [4, 8] },
                    ligatureSets: [
                        [{ ligGlyph: 17, components: [5] }, { ligGlyph: 18, components: [6] }],
                        [{ ligGlyph: 19, components: [1, 2] }]
                    ]
                }]
            }]);
        });
    });
});
