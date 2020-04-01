const FETCH = require('node-fetch');
const config =  require('./config.json');
const wordnikURL = "http://api.wordnik.com/v4/";

module.exports.WPARTOFSPEECH =
{
    ABBREVIATION : 'abbreviation',
    ADJECTIVE :  'adjective',
    ADVERB :  'adverb',
    AFFIX : 'affix',
    ARTICLE : 'article',
    AUXILIARY_VERB : 'auxiliary-verb',
    CONJUNCTION : 'conjunction',
    COMBINING_FORM : 'combining-form',
    DEFINITE_ARTICLE : 'definite-article',
    FAMILY_NAME :  'family-name',
    GIVEN_NAME :  'given-name',
    IDIOM :  'idiom',
    IMPERATIVE :  'imperative',
    INDEFINITE_ARTICLE : 'indefinite-article',
    INTERJECTION : 'interjection',
    NOUN_PLURAL :  'noun-plural',
    NOUN : 'noun',
    NOUND_SINGULAR : 'noun-singular',
    PARTICIPLE : 'participle',
    PAST_PARTICIPLE : 'past-participle',
    PREFIX :  'prefix',
    PHRASAL_VERB : 'phrasal-verb',
    PREPOSITION :  'preposition',
    PRONOUN : 'pronoun',
    PROPER_NOUN_PLURAL : 'proper-noun-plural',
    PROPER_NOUN : 'proper-noun',
    SUFFIX : 'suffix',
    VERB_INTRANSITIVE : 'verb-intransitive',
    VERB_TRANSITIVE :  'verb-transitive',
    VERB : 'verb'
}

async function GetJson(url)
{
    
    var response = await FETCH(url);
    var json = await response.json();
    return json;
}

async function QueryWordNik(command, settings)
{
    return await GetJson(wordnikURL + command + "?" + settings + "api_key=" + config.wordnikKey);
}


module.exports.GetWordOfDay = async function ()
{
    var WordInfo = await QueryWordNik("words.json/wordOfTheDay", "");
    return WordInfo;
}

module.exports.GetDefinitions = async function(wordStr, limit = 5, includeRelated = false, useCanonical = true, includeTags = false)
{
    var settings = "limit=" + limit + "&includeRelated" + includeRelated + "&useCanonical=" + useCanonical + "&includeTags" + includeTags + "&";
    var Definitions = await QueryWordNik("word.json/" + wordStr + "/definitions",settings);
    return Definitions;
}