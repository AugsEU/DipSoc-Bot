const dict =  require('./dictionary.js');

/* Javascript version of cntdn
 *
 * Countdown game solver
 *
 * James Stanley 2014
 */

function _recurse_solve_letters(letters, node, used_letter, cb, answer) {
    if (node[0])
        cb(answer, node[0]);

    if (answer.length == letters.length)
        return;

    var done = {};

    for (var i = 0; i < letters.length; i++) {
        var c = letters.charAt(i);

        if (used_letter[i] || done[c])
            continue;

        if (node[c]) {
            used_letter[i] = true;
            done[c] = true;
            _recurse_solve_letters(letters, node[c], used_letter, cb, answer+c);
            used_letter[i] = false;
        }
    }
}

module.exports.solve_letters = function (letters, callback) 
{
    _recurse_solve_letters(letters, dict.dictionary, {}, callback, '');
}

module.exports.word_in_dictionary = function (word) 
{
    var node = dict.dictionary;
    var idx = 0;

    while (idx < word.length) 
    {
        node = node[word.charAt(idx)];
        idx++;
        if (!node)
            return false;
    }

    if (!node[0])
        return false;
    return true;
}