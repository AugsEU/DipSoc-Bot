const fs = require('fs');
const _ = require('underscore');
const DISCORD = require('discord.js');
const Wordnik_API = require('./wordnik.js'); 
const COUNTDOWN = require('./countdown.js'); 
const config =  require('./config.json');
const emojis = require('./random-emoji.js');
const Grapheme = require('grapheme-splitter');
var G_splitter = new Grapheme();


const BOT = new DISCORD.Client;

const STATUS = {
    MIND : 'The Mind',
    AVALON: 'Avalon',
    COUNTDOWN: 'Countdown',
    DECRYPTO: 'Decrypto',
    JOBINTERVIEW: 'Job interview simulator',
    CANTSTOP: 'can\'t stop',
    READY: 'ready'
}

var BotStatus = STATUS.READY;
var BankAccounts = [];

BOT.on("ready", () =>{
    LoadAccounts();
    console.log("Bot is online.");
})


BOT.on("message", msg =>{

    if(msg.author.bot) return;//ignore any bots(including this one)

    if(BotStatus == STATUS.JOBINTERVIEW)
    {
        switch(JState)
        {
            case JOBSIMSTATE.SPEAK:
                CandidatesSay(msg);
                break;
        }
    }

    if(msg.content.indexOf(config.prefix) !== 0) return;

    var noSpace = msg.content.replace(/\s+/g, " ");
    let args = noSpace.substring(config.prefix.length).toLowerCase().split(" ");

    if(BotStatus === STATUS.COUNTDOWN)
    {
        switch(args[0])
        {
            case "stopcountdown":
                msg.channel.send("Stopping countdown...");
                BotStatus = STATUS.READY;
                try
                {
                    clearInterval(CDUpdater);

                    return;
                }
                catch(err)
                {
                    console.error(err);
                    CloseBot();
                }
                break;
        }
        
        CDWord(msg, args[0]);
        return;
    }
    

    switch(args[0])
    {
        case "help":
            if(args[1] == "avalon")
            {
                msg.channel.send(config.avalonHelp);
            }
            else if(args[1] == "slots")
            {
                msg.channel.send(config.slotsHelp);
            }
            else if(args[1] == "mind")
            {
                msg.channel.send(config.mindHelp);
            }
            else if(args[1] == "countdown")
            {
                msg.channel.send(config.countdownHelp);
            }
            else if(args[1] == "decrypto")
            {
                msg.channel.send(config.decryptoHelp);
            }
            else if(args[1] == "jobsim")
            {
                msg.channel.send(config.jobsimHelp);
            }
            else 
            {
                msg.channel.send(config.helpMsg);
            }
            break;
        case "status":
            msg.channel.send("Current Status: " + BotStatus);
            if(BotStatus == STATUS.AVALON)
            {
                msg.channel.send("Avalon status:"+ AState); 
            }
            break;
        case "avalon":
            if(BotStatus == STATUS.READY)
            {
                BotStatus = STATUS.AVALON;
                msg.channel.send("A game of Avalon is starting in #" + msg.channel.name + ". Enter !join if you want to join the game.");
                AvalonChannel = msg.channel;
                InitAvalon();
            }
            else //bot can't start the game because it's not ready
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of avalon.");
            }
            break;
        case "mind":
            if(BotStatus === STATUS.READY)
            {
                BotStatus = STATUS.MIND;
                msg.channel.send("A game of \"The Mind\":brain:  is starting in #" + msg.channel.name + ". Enter !join if you want to join the game.");
                MindChannel = msg.channel;
                InitMind();
            }
            else
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of the mind.");
            }
            break;
        case "countdown":
            if(BotStatus === STATUS.READY)
            {
                BotStatus = STATUS.COUNTDOWN;
                InitCountdown(msg.channel, args);
            }
            else
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of countdown.");
            }
            break;
        case "decrypto":
            if(BotStatus === STATUS.READY)
            {
                BotStatus = STATUS.DECRYPTO;
                msg.channel.send("A game of Decrypto :robot: is starting in #" + msg.channel.name + ". Enter !join if you want to join the game.");
                DecryptoChannel = msg.channel;
                InitDecrypto();
            }
            else
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of decrypto.");
            }
            break;
        case "jobsim":
            if(BotStatus == STATUS.READY)
            {
                BotStatus = STATUS.JOBINTERVIEW;
                var interviewSimEmoji = ":man_office_worker:";
                if(Math.random() >= 0.5) interviewSimEmoji = ":woman_office_worker:";
                msg.channel.send("A game of Job interview simulator "+ interviewSimEmoji + " is starting in #" + msg.channel.name + ". Enter !join if you want to join the game.");
                JobChannel = msg.channel;
                InitJobSim();
            }
            else
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of decrypto.");
            }
            break;
        case "cantstop":
            if(BotStatus == STATUS.READY)
            {
                BotStatus = STATUS.CANTSTOP;
                msg.channel.send("A game of Can\'t Stop :game_die: is starting in #" + msg.channel.name + ". Enter !join if you want to join the game.");
                CSChannel = msg.channel;
                InitCantStop();
            }
            else
            {
                msg.channel.send("Bot is currently doing something else! Can't start a game of decrypto.");
            }
            break;
        case "slots":
            if(args[1] == "pull")
            {
                PullSlot(msg);
            }
            else if(args[1] == "highscore")
            {
                var HS = GetSlotHS();
                msg.channel.send("Current slots highscore is:\n" + HS[1] +"$ by " + HS[0]);
            }
            break;
        case "account":
            ShowBalance(msg);
            break;
        case "word":
            WordCommand(msg);
            break;
        case "ding":
            msg.channel.send("🟦".repeat(1999));
            break;
        case "roll":
            var MaxVal = 10;
            if(!isNaN(args[1]))
            {
                var MaxVal = Number(args[1]);
            }
            var Num = Math.ceil(Math.random()*MaxVal);
            msg.reply("Rolling from 1 to " + MaxVal + "...\nYou rolled a " + Num);
            break;
    }

    switch(BotStatus)
    {
        case STATUS.AVALON:
            switch(args[0])
            {
                case "stopavalon":
                    msg.channel.send("Someone flips over a card and the game is ruined! Stopping Avalon....");
                    BotStatus = STATUS.READY;
                    break;
                case "join":
                    JoinAvalon(msg);
                    break;
                case "who":
                    WhoGame(APlayers, msg);
                    break;
                case "roles":
                    DeclareRoles(msg);
                    break;
                case "start":
                    StartAvalon(msg);
                    break;
                case "mission":
                    MissionAvalon(msg);
                    break;
                case "approve":
                    AvalonVote(args[0], msg);
                    break;
                case "accept":
                    AvalonVote("approve", msg);
                    break;
                case "reject":
                    AvalonVote(args[0], msg);
                    break;
                case "success":
                    AvalonMissionVote(args[0], msg);
                    break;
                case "fail":
                    AvalonMissionVote(args[0], msg);
                    break;
                case "lady":
                    LadyAvalon(msg);
                    break;
                case "assassinate":
                    AssassinateAvalon(msg);
                    break;
                case "prevmissions":
                    PreviousAvalon(msg);
                    break;
                case "sfx":
                    AvalonSfx(msg);
                    break;
            }
            break;
        case STATUS.MIND:
            switch(args[0])
            {
                case "stopmind":
                    msg.channel.send("Stopping \"The Mind\"...");
                    BotStatus = STATUS.READY;
                    break;
                case "join":
                    JoinMind(msg);
                    break;
                case "who":
                    WhoGame(MPlayers, msg);
                    break;
                case "start":
                    StartMind(msg);
                    break;
                case "ready":
                    MindReady(msg);
                    break;
                case "play":
                    MindPlay(msg);
                    break;
                case "shuriken":
                    MindShuriken(msg);
                    break;
            }
            break;
        case STATUS.DECRYPTO:
            switch(args[0])
            {
                case "stopdecrypto":
                    msg.channel.send("Someone knocks over their words and the game is ruined! Stopping Decrypto....");
                    BotStatus = STATUS.READY;
                    break;
                case "join":
                    JoinDecrypto(msg);
                    break;
                case "who":
                    WhoDecrypto(msg);
                    break;
                case "start":
                    StartDecrypto(msg);
                    break;
                case "clue":
                    DecryptoClue(msg);
                    break;
                case "guess":
                    DecryptoGuess(msg);
                    break;
            }
            break;
        case STATUS.JOBINTERVIEW:
            switch(args[0])
            {
                case "stopjobsim":
                    msg.channel.send("Stopping Job interview simulator....");
                    BotStatus = STATUS.READY;
                    break;
                case "join":
                    
                    JoinJobSim(msg,);
                    break;
                case "who":
                    WhoGame(JPlayers, msg);
                    break;
                case "start":
                    args = args.splice(1);
                    if(!args) args = [];
                    StartJobSim(msg, args);
                    break;
                case "question":
                    JobQuestion(msg);
                    break;
                case "hire":
                    JobHire(msg);
                    break;
                case "seize":
                    JobSeize(msg);
                    break;
            }
            break;
        case STATUS.CANTSTOP:
            switch(args[0])
            {
                case "stopcs":
                    msg.channel.send("Stopping Can\'t Stop...");
                    BotStatus = STATUS.READY;
                    break;
                case "join":
                    JoinCS(msg,);
                    break;
                case "who":
                    WhoGame(CSPlayers, msg);
                    break;
                case "start":
                    StartCS(msg);
                    break;
                case "a":
                case "action":
                    if(isNaN(args[1])){ msg.reply("I don't understand this."); return;}
                    ActionCS(msg, Number(args[1]) - 1);
                    break;
                case "c":
                case "continue":
                    CSContinue(msg);
                    break;
                case "s":
                case "stop":
                    CSStop(msg);
                    break;
            }
            break;
    }

})

BOT.login(config.token);


///
///Words
///

function WordCommand(msg)
{
    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");
    if(typeof(args[1]) =="undefined")
    {
        SayWordOfDay(msg.channel);
        return;
    }

    switch(args[1].toLowerCase())
    {
        case "oftheday":
            SayWordOfDay(msg.channel);
            break;
        case "define":
            DefineWord(args[2],msg.channel)
            break;
    }
}

async function DefineWord(wordStr, channel)
{
    var Definitions = await Wordnik_API.GetDefinitions(wordStr);
    for(var i = 0; i < Definitions.length; i++)
    {
        if(typeof(Definitions[i].text) !== "undefined")
        {
            
            channel.send(PresentWord({"word":wordStr},Definitions[i]));
            return;
        }
    }
    channel.send("Could not define " + wordStr);
}

async function SayWordOfDay(channel)
{
    var WordOfDay = await Wordnik_API.GetWordOfDay();
    channel.send(PresentWord(WordOfDay, WordOfDay.definitions[0]));
}

function PresentWord(word, definition)
{
    var DefText = definition.text.replace(/<\/?[^>]+(>|$)/g, "");
    const WordEmbed = new DISCORD.MessageEmbed()
        .setColor('#808065')
	    .setTitle(word.word)
	    .setAuthor('Dipsoc bot teaches words', 'https://i.imgur.com/1Ng6L1l.png')
        .setDescription("*" + definition.partOfSpeech + ".* " + DefText);
    
    if(typeof(word.note) != "undefined")
        WordEmbed.setFooter('Fun fact: ' + word.note);

    return WordEmbed;
}

///
///Dipsoc bank accounts
///

function LoadAccounts()
{
    var BankData = [];
    try 
    {
        const data = fs.readFileSync('./Accounts.txt', 'utf8');
        BankData = data.split(/\r?\n/);//split by new line
    } 
    catch (err) 
    {
        console.error(err);
        CloseBot();
    }

    for(var i = 0; i < BankData.length; i++)
    {
        var Line = BankData[i].split(" ");
        BankAccounts.push([Line[0], Line[1]])
    }
}

function SaveAccounts()
{
    var BankText = "";
    for(var i = 0; i < BankAccounts.length; i++)
    {
        BankText = BankText + BankAccounts[i][0] + " " + BankAccounts[i][1];
        if(i != BankAccounts.length-1)
        {
            BankText = BankText + "\n";
        }
    }
    
    try 
    {
        const data = fs.writeFileSync('./Accounts.txt', BankText);
        //file written successfully
    } 
    catch (err)
    {
        console.error(err);
        CloseBot();
    }
}

function ShowBalance(msg)
{
    var foundAcc = false;
    var ReplyMsg = "";
    for(var i = 0; i < BankAccounts.length; i++)
    {
        if(BankAccounts[i][0] == msg.member.id)
        {
            foundAcc = true;
            ReplyMsg = "you have " + BankAccounts[i][1] + "$."
        }
    }
    if(!foundAcc)
    {
        ReplyMsg = "you don't have an account. Type \"!slots pull\" to create one."
    }

    msg.reply(ReplyMsg);
}

///
///Cant Stop
///

const CS_STATES = 
{
    JOIN: 'join',
    GAME_READY: 'gameready',
    ACTION: 'Action',
    CONTSTOP: 'Continue or Stop'
}

const CS_DICE_TYPES = 
{
    NUMBER: 'num',
    EVENT: 'event'
}

const CS_ROLLTYPES =//different types of actions
{
    NOTPOSSIBLE: 'not possible',
    NORMALADD: 'normal add',
    EVENT: 'event',
}

//Class Defs
//Mountain: {Wins: , Tiles: };
//Dice: {Type: , Value: }
//Token: {Line: , Height: }
//Action: {Type: , Values: []} or {Type: , Event: , Values: []}

const EventProb = 25;
const CS_DICE_EVENTS = ['explosion', 'rock slide', 'tornado'];
const DiceSplits = [[0,1,2,3],[0,2,1,3],[0,3,1,2]];

var CSPlayers;
var Mountain;
var CSChannel;
var CSState;
var CSDieSides;
var CSTurnIdx;
var TempTokens;
var CurrentDice;
var CurrentOptions;


function InitCantStop()
{
    CSPlayers = [];
    Mountain = {Wins: [], Tiles: []};
    CSState = CS_STATES.JOIN;
    CSDieSides = 6;
    CSTurnIdx = 0;
    TempTokens = [];
    CurrentOptions = [];
}

function JoinCS(msg)
{
    if(msg.channel != CSChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(CSPlayers.length >= 9)
    {
        msg.reply("Sorry, the game is already at capacity.");
        return;
    }

    if(CSState == CS_STATES.JOIN)
    {
        if(!ArrSearch(CSPlayers, msg.author.id))
        {
            CSPlayers.push([msg.author.id, msg.member,'']);
            CSChannel.send(msg.member.displayName + " has joined the game.");
        }
        else
        {
            msg.reply("looks like you are already part of the game.");
        }
    }
    else
    {
        msg.channel.send("You can't join; the game is already in progress.");
    }
}

function StartCS(msg)
{
    if(msg.channel != CSChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(CSState != CS_STATES.JOIN)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(CSPlayers.length < 2)
    {
        msg.reply("Not enough people to start the game. Need at least 2 people.");
        return;
    }

    CSState = CS_STATES.GAME_READY;
    var StartBreif = "Can't Stop has begun.\n";

    CSDieSides = CSPlayers.length + 1;
    CSDieSides = Math.max(6,CSDieSides);//6 sides is the minimum.
    CSDieSides = Math.min(10,CSDieSides);//10 is the maximum.

    var PlayerEmojis = emojis.randomAnimalEmojiSet(CSPlayers.length);
    for(var i = 0; i < CSPlayers.length; i++)
    {
        CSPlayers[i][2] = PlayerEmojis[i];
        StartBreif = StartBreif + CSPlayers[i][1].displayName + " is " + PlayerEmojis[i] + "\n";
    }

    Mountain = GenerateCSMountain();//

    shuffle(CSPlayers);
    CSChannel.send(StartBreif);
    CSStartNextTurn();
}

function GenerateCSMountain()
{
    var Width = (CSDieSides)*2-1;
    var MountainTiles = [];
    var MountainWins = [];
    for(var i = 0; i < Width; i++)//fill in mountain squares
    {
        var Col = [];
        var ColHeight = GetHeightFromDie(CSDieSides,i);
        for(var j = 0; j < ColHeight; j++)
        {
            Col.push(-1); //-1 Means nobody is on this tile.
        }
        MountainTiles.push(Col);
        MountainWins.push(-1);//-1 means nobody has won this tile.
    }
    
    return Mountain = {Wins: MountainWins, Tiles: MountainTiles};
}

function GetHeightFromDie(DieNum,i)
{
    return 2*Math.min(2+i,DieNum*2-i)-1;
}

function GetMaxHeightFromDie(DieNum)
{
    return 2*DieNum + 1;
}

function DrawMountain()
{
    var Width = Mountain.Tiles.length;
    var Height = GetMaxHeightFromDie(CSDieSides);
    var ReturnStr = "";

    for(var y = Height-1; y >= 0;y--)//draw tiles
    {
        for(var x = 0; x < Width; x++)
        {
            if(y < Mountain.Tiles[x].length)//if this tile is a part of the mountain
            {
                //CheckWinStatus
                if(Mountain.Wins[x] != -1)//this column is no longer in play.
                {
                    if(Mountain.Wins[x] >= 0)
                    {
                        ReturnStr = ReturnStr.concat(CSPlayers[Mountain.Wins[x]][2]);
                    }
                    else
                    {
                        ReturnStr = ReturnStr.concat("🟦");//default value
                    }
                    continue;
                }
                
                //Check tokens
                var FoundToken = false;
                for(var t = 0; t < TempTokens.length;t++)//search temp tokens  
                {
                    if(TempTokens[t].Line == x && TempTokens[t].Height == y)
                    {
                        ReturnStr = ReturnStr.concat("🧗");//Draw climber emoji
                        FoundToken = true;
                    }
                }

                if(FoundToken) continue;//skip below section if a token has been found.

                if(Mountain.Tiles[x][y] == -1)
                {
                    ReturnStr = ReturnStr.concat("🌫️");//Draw a fog emoji
                }
                else
                {
                    var PlayerIdx = Mountain.Tiles[x][y];
                    ReturnStr = ReturnStr.concat(CSPlayers[PlayerIdx][2]);//draw relavent player emoji
                }
            }
            else
            {
                ReturnStr = ReturnStr.concat("🟦");//Draw blue sky
            }
        }
        ReturnStr = ReturnStr.concat("\n");//new line
    }

    var NumDigits = Math.floor(Math.log10(Width)) + 1;//number of digits to draw.
    for(var d = 0; d < NumDigits;d++)//draw numbers below.
    {
        for(var i = 0; i < Width; i++)
        {
            if(d >= i.toString().length) 
            {
                ReturnStr = ReturnStr.concat(emojis.randomBaseCampEmoji());
            }
            else
            {   
                var DigitEmoji = DigitToEmoji(GetNthDigit(i,d));
                ReturnStr = ReturnStr.concat(DigitEmoji);
            }
        }
        ReturnStr = ReturnStr.concat("\n");//new line
    }

    return ReturnStr;
}

async function CSStartNextTurn()
{
    TempTokens = [];
    var Breif = DrawMountain() + "\nIt is <@!" + CSPlayers[CSTurnIdx][1].id + ">'s turn.\n";
    await SendFragmented(CSChannel, Breif, 195);
    CSTurnAction();
}

async function CSTurnAction()
{
    CSState = CS_STATES.ACTION;
    var Breif = "=====================================\nUnused Tokens:" + ("🧗 ".repeat(3-TempTokens.length) + "\n");
    CSRollDice();
    Breif = Breif.concat("You rolled: ");
    for(var i = 0; i < CurrentDice.length; i++)
    {
        Breif = Breif.concat(CSDiceEmoji(CurrentDice[i]));
    }
    Breif = Breif.concat("\nYou have the following options:\n");

    for(var i = 0; i < DiceSplits.length;i++)
    {
        var Split = DiceSplits[i];
        Breif = Breif.concat( CSDiceEmoji(CurrentDice[Split[0]]) + " " + CSDiceEmoji(CurrentDice[Split[1]]) + " + " +  CSDiceEmoji(CurrentDice[Split[2]]) + " " + CSDiceEmoji(CurrentDice[Split[3]]) + ":\n");
        var NewActions = CSDetermineSplit(i);
        for(var a = 0; a < NewActions.length; a++)
        {
            CurrentOptions.push(NewActions[a])
            Breif = Breif.concat(CurrentOptions.length.toString() + ") " + DescribeDiceActions(NewActions[a]) + "\n");
        }
    }
    var IsPossible = false;//Is it possible to continue?
    for(var i = 0; i < CurrentOptions.length;i++)
    {
        if(CurrentOptions[i].Type != CS_ROLLTYPES.NOTPOSSIBLE) IsPossible = true;//it is possible
    }

    if(IsPossible)
    {
        Breif = Breif.concat("\nChoose one of these options by typing !action.\nEx:!action 3 to choose option 3.");
        await CSChannel.send(Breif);
    }
    else
    {
        Breif = Breif.concat("\n:x:You ran out of options. Your turn is over.");
        await CSChannel.send(Breif);
        CSEndTurn();
    }

}

function DescribeDiceActions(action)
{
    switch(action.Type)
    {
        case CS_ROLLTYPES.NOTPOSSIBLE:
            return "❌ Not possible.";
        case CS_ROLLTYPES.NORMALADD:
            var Desc = "Advance on tracks ";
            Desc = Desc + action.Values.join(" and ");
            return Desc;
        case CS_ROLLTYPES.EVENT:
            var Desc = "Trigger " + action.Event + " on track " + action.Values[0];
            return Desc;
    }
}

function CSDetermineSplit(splitIdx)//returns an array of action objects.
{
    var Pairs = [[CurrentDice[DiceSplits[splitIdx][0]],CurrentDice[DiceSplits[splitIdx][1]]], [CurrentDice[DiceSplits[splitIdx][2]],CurrentDice[DiceSplits[splitIdx][3]]] ];
    for(var p = 0; p < 2; p++)
    {
        if(DicePairContains(Pairs[p],CS_DICE_TYPES.EVENT) == 2)//a pair may not contain two event dice
        {
            return [{Type: CS_ROLLTYPES.NOTPOSSIBLE}];
        }
    }

    var NumEvents = DicePairContains(CurrentDice, CS_DICE_TYPES.EVENT);
    var ReturnActions = [];//Possible Actions
    switch(NumEvents)
    {
        case 0:
            var TracksToAdvance = [Pairs[0][0].Value + Pairs[0][1].Value, Pairs[1][0].Value + Pairs[1][1].Value];
            var ActionToPush = {Type: CS_ROLLTYPES.NORMALADD, Values: []};//action to

            for(var i = 0; i < TempTokens.length; i++)//check current tokens for available tracks.
            {
                if(TracksToAdvance.includes(TempTokens[i].Line) && Mountain.Wins[TempTokens[i].Line] == -1)
                {
                    ActionToPush.Values.push(TempTokens[i].Line);//add action to advance on that track.
                    RemoveElement(TracksToAdvance, TempTokens[i].Line);
                }
            }
            //Now check unused tokens for possible actions
            var UnusedTokens = 3 - TempTokens.length;//number of unused tokens

            if(UnusedTokens == 0)
            {
                ReturnActions.push(ActionToPush);//push the action
            }
            else if(UnusedTokens == 1)//this should be done by considering subsets but whatever
            {
                for(var i = 0; i < TracksToAdvance.length; i++)//
                {
                    if(Mountain.Wins[TracksToAdvance[i]] == -1)//-1 means it's available
                    {
                        var NewTracks = ActionToPush.Values.concat(TracksToAdvance[i]);
                        if(TracksToAdvance.length == 2 && TracksToAdvance[0] == TracksToAdvance[1]) NewTracks.push(TracksToAdvance[i]);
                        ReturnActions.push({Type: CS_ROLLTYPES.NORMALADD, Values: NewTracks});//add action to advance on that track.
                    }
                }
            }
            else if(UnusedTokens >= 2)
            {
                for(var i = 0; i < TracksToAdvance.length; i++)//
                {
                    if(Mountain.Wins[TracksToAdvance[i]] == -1)//-1 means it's available
                    {
                        ActionToPush.Values.push(TracksToAdvance[i]);
                    }
                }
                ReturnActions.push(ActionToPush);//push the action
            }
            break;
        case 1:
            //Make it so that first pair has event in it.
            if(DicePairContains(Pairs[1], CS_DICE_TYPES.EVENT) >= 1)//second pair has event
            {
                SwapElements(Pairs,0,1);//swap them so 0 has the event.
            }

            var MyEvent = '';
            for(var i = 0; i < Pairs[0].length; i++)//find event
            {
                if(Pairs[0][i].Type == CS_DICE_TYPES.EVENT) MyEvent = Pairs[0][i].Value;
            }

            var TrackToAdvance = Pairs[1][0].Value +Pairs[1][1].Value;//Target track
            for(var i = 0; i < 3; i++)//check current tokens for available tracks.
            {
                var ShouldAdd = false;
                if(i < TempTokens.length)
                {
                    ShouldAdd = (TrackToAdvance == TempTokens[i].Line && Mountain.Wins[TrackToAdvance] == -1);
                }
                else//unassigned tokens
                {
                    ShouldAdd = (Mountain.Wins[TrackToAdvance] == -1);
                }

                if(ShouldAdd)
                {
                    ReturnActions.push({Type: CS_ROLLTYPES.EVENT, Event: MyEvent, Values: [TrackToAdvance]});//add action to advance on that track.
                    break;
                }
            }
            break;
        case 2:
            //Make it so that first dice of each pair has event in it.
            var MyEvent = '';
            for(var p = 0; p < Pairs.length; p++)//find event
            {
                if(Pairs[p][1].Type == CS_DICE_TYPES.EVENT) SwapElements(Pairs[p], 0,1);
            }

            var TrackToAdvance = Pairs[0][1].Value +Pairs[1][1].Value;//Target track
            for(var i = 0; i < 3; i++)//check current tokens for available tracks.
            {
                var ShouldAdd = false;
                if(i < TempTokens.length)
                {
                    ShouldAdd = (TrackToAdvance == TempTokens[i].Line && Mountain.Wins[TrackToAdvance] == -1);
                }
                else//unassigned tokens
                {
                    ShouldAdd = (Mountain.Wins[TrackToAdvance] == -1);
                }

                if(ShouldAdd)
                {
                    ReturnActions.push({Type: CS_ROLLTYPES.EVENT, Event: Pairs[0][0].Value, Values: [TrackToAdvance]});//add action to advance on that track.
                    ReturnActions.push({Type: CS_ROLLTYPES.EVENT, Event: Pairs[1][0].Value, Values: [TrackToAdvance]});//add action to advance on that track.
                    break;//Don't make any more actions based on this
                }
            }
            break;
    }

    for(var i = 0; i < ReturnActions.length; i++)
    {
        if(ReturnActions[i].hasOwnProperty("Values") && ReturnActions[i].Values.length == 0)
        {
            ReturnActions.splice(i,1);
            i--;
        }
    }

    if(ReturnActions.length == 0) ReturnActions.push({Type: CS_ROLLTYPES.NOTPOSSIBLE});
    return ReturnActions;
}

function ActionCS(msg, actionIdx)
{
    if(msg.channel !== CSChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(CSState != CS_STATES.ACTION)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(msg.author.id !== CSPlayers[CSTurnIdx][1].id)
    {
        msg.reply("it's not your turn.");
        return;
    }

    if(actionIdx >= CurrentOptions.length || actionIdx < 0 || !Number.isInteger(actionIdx))
    {
        msg.reply("not a valid option. Try again.");
        return;
    }

    if(CurrentOptions[actionIdx].Type == CS_ROLLTYPES.NOTPOSSIBLE)
    {
        msg.reply("That option is not possible");
        return;
    }

    CSExecuteAction(CurrentOptions[actionIdx]);
    CSState = CS_STATES.CONTSTOP;
    BreifCSStop();
}



function CalculateNewTokenHeight(Line, Height)
{
    var Top = Mountain.Tiles[Line].length-1;
    do 
    {
        Height = Math.min(Height+1,Top);
    }
    while (Mountain.Tiles[Line][Height] != -1 && Height != Top);
    return Height;
}

function BreifCSStop()
{
    CSChannel.send(DrawMountain() + "\n========================\nWould you like to stop or keep playing? Type !continue or !stop.\n(Also !c and !s work too.)");
}

function CSContinue(msg)
{
    if(msg.channel !== CSChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(CSState != CS_STATES.CONTSTOP)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(msg.author.id !== CSPlayers[CSTurnIdx][1].id)
    {
        msg.reply("it's not your turn.");
        return;
    }
    CSChannel.send("You decide to continue...");
    CSTurnAction();
}

function CSStop(msg)
{
    CSChannel.send("You decide to stop...");
    //Save temp tokens.
    for(var t = 0; t < TempTokens.length;t++)
    {

        var x = TempTokens[t].Line;
        var y = TempTokens[t].Height;
        ReplaceElement(Mountain.Tiles[x],CSTurnIdx,-1);//remove old permo token
        Mountain.Tiles[x][y] = CSTurnIdx;//add new permo token
        if(y == Mountain.Tiles[x].length - 1) Mountain.Wins[x] = CSTurnIdx;
    }
    var Winner = GetWinner();
    if(Winner == -1)
    {
        CSEndTurn();
    }
    else
    {
        CSChannel.send("=========================\n🎊🎊🎊" + CSPlayers[Winner][1].displayName + " has won.🎊🎊🎊");
        BotStatus = STATUS.READY;
    }
}

function GetWinner()//finds the index of the winner. If there is none, then returns -1
{
    var PlayerWinsTotal = new Array(CSPlayers.length).fill(0);;
    for(var i = 0; i < Mountain.Wins;i++)
    {
        if(Mountain.Wins[i] != -1)
        {
            var PathWinner = Mountain.Wins[i];
            PlayerWinsTotal[PathWinner]++;
            if(PlayerWinsTotal[PathWinner] >= 3) return PathWinner;
        }
    }
    return -1;
}

function CSEndTurn()
{
    CSTurnIdx = mod(CSTurnIdx + 1, CSPlayers.length);
    CSStartNextTurn();
}

function DicePairContains(Dice, Type)
{
    var Total = 0;
    for(var i = 0; i < Dice.length; i++)
    {

        if(Dice[i].Type == Type) Total++;
    }
    return Total;
}

function CSRollDice()
{
    CurrentDice = [];
    CurrentOptions = [];
    for(var i = 0; i < 4; i++)//roll 4 dice
    {
        var NewDice = {Type: '', Value: ''};
        if(OneInN(EventProb))//1 in N chance
        {
            //special dice
            NewDice.Type = CS_DICE_TYPES.EVENT;
            NewDice.Value = RandEle(CS_DICE_EVENTS);
        }
        else
        {
            //normal number
            NewDice.Type = CS_DICE_TYPES.NUMBER;
            NewDice.Value = Math.floor(Math.random()*CSDieSides);
        }
        CurrentDice.push(NewDice);
    }
}

function CSDiceEmoji(Die)
{
    if(Die.Type == CS_DICE_TYPES.NUMBER)
    {
        return DigitToEmoji(Die.Value);
    }
    else
    {
        switch(Die.Value)
        {
            case CS_DICE_EVENTS[0]://explosion
                return "💥";
            case CS_DICE_EVENTS[1]://rock slide
                return "⏬"
            case CS_DICE_EVENTS[2]://rock slide
                return "🌪️"
        }
    }
    return "🟦";//default blue square
}

function CSExecuteAction(Action)
{
    if(Action.Type == CS_ROLLTYPES.NOTPOSSIBLE)
    {
        console.log("ERROR: Impossible action.");
        CloseBot();
    }
    //Apply normal token rules
    for(var L = 0; L < Action.Values.length;L++)//for each line we need to progress on.
    {
        var LineToProgress = Action.Values[L];
        var FoundToken = false;//does this line already have a temporary token on it?
        //Search for tokens currently being used.
        for(var i = 0; i < TempTokens.length;i++)
        {
            if(TempTokens[i].Line == LineToProgress)
            {
                TempTokens[i].Height = CalculateNewTokenHeight(LineToProgress, TempTokens[i].Height);
                FoundToken = true;
            }
        }

        if(!FoundToken)//if we haven't found one then add one.
        {
            var PlayerHeight = Mountain.Tiles[LineToProgress].indexOf(CSTurnIdx);//Height of the player on that line.
            TempTokens.push({Line: LineToProgress, Height: CalculateNewTokenHeight(LineToProgress, PlayerHeight)});
        }
    }

    if(Action.Type == CS_ROLLTYPES.EVENT)
    {
        var EventLine = Action.Values[0];
        var TokenOnLineIdx = -1;//Find the index of the token on this event line.
        for(var i = 0; i < TempTokens.length;i++)
        {
            if(TempTokens[i].Line == EventLine)
            {
                TokenOnLineIdx = i;
                break;    
            }
        }
        switch(Action.Event)
        {
            case CS_DICE_EVENTS[0]://Explosion. Shortens the line by 1. 
                if(Mountain.Tiles[EventLine].length <= 1) break;
                Mountain.Tiles[EventLine].splice(0,1);//delete first element.
                TempTokens[TokenOnLineIdx].Height = TempTokens[TokenOnLineIdx].Height-1;
                if(TempTokens[TokenOnLineIdx].Height < 0) TempTokens.splice(TokenOnLineIdx,1);//remove a temporary token that fell off the bottom.
                break;

            case CS_DICE_EVENTS[1]://Rock slide, everyone falls down to the bottom in a big pile
                var LineLength = Mountain.Tiles[EventLine].length;
                var PileOrder = [];
                for(var y = 0; y < LineLength;y++)
                {
                    var CharacterOnLine = Mountain.Tiles[EventLine][y];
                    if(CharacterOnLine >= 0)
                    {
                        PileOrder.push(CharacterOnLine);
                    }
                    else if(TempTokens[TokenOnLineIdx].Height == y)
                    {
                        PileOrder.push('t');
                        TempTokens[TokenOnLineIdx].Height = PileOrder.length - 1;
                    }
                }

                Mountain.Tiles[EventLine] = [];
                for(var y = 0; y < LineLength;y++)
                {
                    if(y < PileOrder.length && !isNaN(PileOrder[y]))
                    {
                        Mountain.Tiles[EventLine].push(PileOrder[y]);
                    }
                    else
                    {
                        Mountain.Tiles[EventLine].push(-1);
                    }
                }
                break;
            case CS_DICE_EVENTS[2]://Tornado
                var Path = Mountain.Tiles[EventLine].splice(0,Mountain.Tiles[EventLine].length - 1);//pop old elements
                shuffle(Path);
                var TokenPlace = 0;
                do
                {
                    TokenPlace = hMath.floor(Math.random() * Path.length)
                }
                while(Path[TokenPlace] != -1)
                TempTokens[TokenOnLineIdx].Height = TokenPlace;
                Mountain.Tiles[EventLine] = Path.concat(-1);//add back the last element
                break;
        }
    }
}


///
///Job Interview Simulator
///

const JOBSIMSTATE = 
{
    JOIN: 'join',
    GAME_READY: 'gameready',
    SPEAK: 'speak',
    INTERVIEWER: 'interviewer\'s turn',
    COMMUNISTREVO: 'communist revolution'
}

const JOBROLES = 
{
    INTERVIEWER: 'the interviewer',
    EXPERT: 'the expert',
    PERCIVAL: 'percival',
    CLUELESS: 'a clueless candidate'
}

const CluelessTeam = [JOBROLES.CLUELESS, JOBROLES.PERCIVAL];

var WordsPerPerson;
var JobChannel;

var JState;
var JPlayers;

var PossibleJobs;
var JobIndex;
var CurrentQuestion;
var Transcript;
var CurrentSpeaker;
var NumQuestions;
var UndoStack;
var IntPunc;

function InitJobSim()
{
    JState = JOBSIMSTATE.JOIN;
    JPlayers = [];
    try 
    {
        const data = fs.readFileSync('./Jobs.txt', 'utf8');
        PossibleJobs = data.split(/\r?\n/);//split by new line
    } 
    catch (err) 
    {
        console.error(err);
        CloseBot();
    }
    JobIndex = 0;
    CurrentQuestion = "";
    CurrentAnswer = "";
    Transcript = [];
    CurrentSpeaker = 0;
    NumQuestions = 0;
    UndoStack = [];
    IntPunc = false;
}

function JoinJobSim(msg)
{
    if(msg.channel !== JobChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(JState == JOBSIMSTATE.JOIN)
    {

        if(!ArrSearch(JPlayers, msg.author.id))
        {
            JPlayers.push([msg.author.id, msg.member,'']);
            JobChannel.send(msg.member.displayName + " has joined the game.");
        }
        else
        {
            msg.reply("looks like you are already part of the game.");
        }
    }
    else
    {
        msg.channel.send("You can't join; the game is already in progress.");
    }
}

function StartJobSim(msg,settings)
{
    if(msg.channel != JobChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(JState != JOBSIMSTATE.JOIN)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(JPlayers.length < 3)
    {
        msg.reply("Not enough people to start the game.");
        return;
    }

    JState = JOBSIMSTATE.GAME_READY;
    WordsPerPerson = Math.max(1,Math.round(15/(JPlayers.length-1)));
    if(settings.includes("intpunc")) IntPunc = true;

    shuffle(JPlayers);//shuffle players
    AssignJobRoles(settings);
    var SampleSize= Math.min(PossibleJobs.length, JPlayers.length*3);
    PossibleJobs = _.sample(PossibleJobs, SampleSize);
    PossibleJobs.sort();//alphabetical sort

    if(JPlayers[CurrentSpeaker][2] == JOBROLES.INTERVIEWER) CurrentSpeaker++;//make sure the interviewer isn't current speaker
    

    JobIndex = Math.floor(Math.random()*PossibleJobs.length);//choose a random job
    var JInterviewerIdx = -1;
    for(var i = 0; i < JPlayers.length;i++)
    {
        switch(JPlayers[i][2])
        {
            case JOBROLES.INTERVIEWER:
                JPlayers[i][1].send("======================\nYou are the interviewer. The job position is: " + PossibleJobs[JobIndex]  +"\nYou must ask questions to the candidates in order to find who is qualified.");
                JInterviewerIdx = i;
                break;
            case JOBROLES.EXPERT:
                JPlayers[i][1].send("======================\nYou are the expert. The job position is: "+ PossibleJobs[JobIndex]  +"\nYou must show that you know what you are talking about to the interviewer, without letting the other candidates know.");
                break;
            case JOBROLES.PERCIVAL:
                var PercivalBreif = "======================\nYou are percival. The following people are experts:\n";
                for(var j = 0; j < JPlayers.length;j++)
                {
                    if(JPlayers[j][2] == JOBROLES.EXPERT)
                    {
                        PercivalBreif = PercivalBreif + JPlayers[j][1].displayName + "\n";
                    }
                }
                PercivalBreif = PercivalBreif + "You can't communicate this information other than through the sentences you form.";
                JPlayers[i][1].send(PercivalBreif);
                break;
            case JOBROLES.CLUELESS:
                JPlayers[i][1].send("======================\nYou are a clueless candidate.");
                break;
        }
    }
    
    
    var StartMessage = "The interview has begun.\n <@!" + JPlayers[JInterviewerIdx][1].id + "> is the interviewer.\nNumber of words per person: " + WordsPerPerson + "\n";
    StartMessage = StartMessage + "These are the possible jobs:\n" + ListAllJobs();
    JobChannel.send(StartMessage);

    BreifInterviewer();
}

function ListAllJobs()
{
    var ReturnMsg = "";
    for(var i = 0; i < PossibleJobs.length;i++)
    {
        ReturnMsg = ReturnMsg + (i+1).toString() + ". " + PossibleJobs[i] + "\n";
    }
    return ReturnMsg;
}

function AssignJobRoles(settings)
{
    //generate roles
    var RolesInGame = [JOBROLES.INTERVIEWER, JOBROLES.EXPERT];
    if(settings.includes("percival")) RolesInGame.push(JOBROLES.PERCIVAL);
    for(var i = RolesInGame.length; i < JPlayers.length;i++)
    {
        RolesInGame.push(JOBROLES.CLUELESS);//fill rest with clueless
    }
    JobChannel.send("The following roles are in the game: " + RolesInGame.join(", "));
    shuffle(RolesInGame);

    for(var i = 0; i < JPlayers.length;i++)
    {
        JPlayers[i][2] = RolesInGame[i];
    }
}

function BreifInterviewer()
{
    JState = JOBSIMSTATE.INTERVIEWER;
    JobChannel.send("It is time for the interviewer to ask a question or hire someone.\n!question to ask a question\ne.g. !question Why are you here?\nType !hire @username to hire someone.");
}

function JobQuestion(msg)
{
    if(msg.channel != JobChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(JState != JOBSIMSTATE.INTERVIEWER)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    
    var Idx = GetMsgSenderIdx(msg.author.id, JPlayers);
    if(Idx == -1)
    {
        msg.reply("you aren't playing the game");
        return;
    }

    if(JPlayers[Idx][2] != JOBROLES.INTERVIEWER)
    {
        DeleteMessage(msg, "you aren't the interviewer");
        return;
    }

    CurrentQuestion = msg.content.split(' ').slice(1).join(' ');
    Transcript.push([CurrentQuestion,""]);//Add question to transcript
    if(CurrentQuestion == "" || CurrentQuestion == " " || CurrentQuestion == "?")
    {
        msg.reply("you didn't enter a question. Try again.");
        return;
    }
    
    BreifCandidates();
}

function BreifCandidates()
{
    JState = JOBSIMSTATE.SPEAK;
    UndoStack = [];
    var CandidatesMessage = "The interviewer has asked their question. Answer in the following order: \n";
    for(var i = 0; i < JPlayers.length-1;i++)
    {
        var Idx = GetSpeakerIndex(i);
        CandidatesMessage = CandidatesMessage + JPlayers[Idx][1].displayName + " \n";
    }
    CandidatesMessage = CandidatesMessage + "The question is: " + CurrentQuestion;
    JobChannel.send(CandidatesMessage);
}

function CandidatesSay(msg)
{
    if(msg.channel != JobChannel)
    {
        return;
    }

    var SpeakerIdx = GetMsgSenderIdx(msg.author.id,JPlayers);
    var Word;
    var Space = " ";
    if(SpeakerIdx != -1 && JPlayers[SpeakerIdx][2] == JOBROLES.INTERVIEWER && IntPunc)
    {
        //reject any bad words
        const ValidWord = /(((\.{3})|[,!….?;:]))/gi;
        Word = msg.content.match(ValidWord);
        if(!Word)
        {
            DeleteMessage(msg, "I don't understand this.");    
            return;
        }
        if(Word.length != 1)
        {
            DeleteMessage(msg, "Too much punctuation.");    
            return;
        }
        Word = Word[0];
        //msg.edit(Word);
        Space = "";
    }
    else
    {

        if(msg.author.id != JPlayers[CurrentSpeaker][1].id)
        {
            DeleteMessage(msg, "it's not your turn.\nIt is <@!" + JPlayers[CurrentSpeaker][1].id + "> 's turn");    
            return;
        }
        //reject any bad words
        const ValidWord = IntPunc? /#?([A-Za-z0-9'-]+)|[&@]/gi  : /(#?([A-Za-z0-9'-]+)((\.{3})|[,!.…?;:%])?)|[&@]/gi;
        var Word = msg.content.match(ValidWord);
        if(!Word)
        {
            DeleteMessage(msg, "I don't understand this.");    
            return;
        }
        if(Word.length != 1)
        {
            DeleteMessage(msg, "I think that's too many words");    
            return;
        }
        
        Word = Word[0];
        //msg.edit(Word);
        UndoStack.push(Word);
        CurrentSpeaker = GetSpeakerIndex(1);//Add one to the current index
        Space = " ";
    }

    Transcript[NumQuestions][1] = Transcript[NumQuestions][1] + Space + Word;//Add to transcript


    //resolve end of the speaking phase
    if(UndoStack.length/(JPlayers.length-1) >= WordsPerPerson && ["!",".","?","…"].includes(Word.charAt(Word.length-1)))
    {
        EndOfQuestion();
    }
}

function EndOfQuestion()
{
    JobChannel.send("```Q:" + Transcript[NumQuestions][0] + "\nA:" + Transcript[NumQuestions][1] + "```");
    NumQuestions++;
    BreifInterviewer();
}

function JobHire(msg)
{
    if(msg.channel != JobChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(JState != JOBSIMSTATE.INTERVIEWER)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    
    var Idx = GetMsgSenderIdx(msg.author.id, JPlayers);
    if(Idx == -1)
    {
        msg.reply("you aren't playing the game");
        return;
    }
    if(JPlayers[Idx][2] != JOBROLES.INTERVIEWER)
    {
        DeleteMessage(msg, "you aren't the interviewer");
        return;
    }

    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");
    if(!args[1])
    {
        msg.reply("I don't understand. Try again.");
        return;
    }

    var LookingFor = args[1].replace(/[\\<>@#&!]/g, "");
    var HiredIndex = GetMsgSenderIdx(LookingFor, JPlayers);
    if(JPlayers[HiredIndex][2] == JOBROLES.INTERVIEWER)
    {
        msg.reply("you can't hire yourself. Try again.");
        return;
    }

    if(CluelessTeam.includes(JPlayers[HiredIndex][2]))//clueless team win
    {
        JobChannel.send("You hired a clueless person...\n***CLUELESS TEAM WINS!!***\n" + JRevealRoles());
        BotStatus = STATUS.READY;
        JobChannel.send(GetTranscript());
    }
    else//communist revolt time
    {
        JobChannel.send("You hired the right person.\nThe clueless people organise a revolution to seize the means of production.\nBut what are they seizing?\n" + ListAllJobs() + "\nUse \"!seize [number]\" to seize the means of production.\ne.g.!seize 3");
        JState = JOBSIMSTATE.COMMUNISTREVO;
    }
}

function JobSeize(msg)
{
    if(msg.channel != JobChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(JState != JOBSIMSTATE.COMMUNISTREVO)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    
    var Idx = GetMsgSenderIdx(msg.author.id, JPlayers);
    if(Idx == -1)
    {
        msg.reply("you aren't playing the game");
        return;
    }
    if(!CluelessTeam.includes(JPlayers[Idx][2]))
    {
        DeleteMessage(msg, "you are the interviewer");
        return;
    }

    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");
    if(!args[1])
    {
        msg.reply("I don't understand. Try again.");
        return;
    }

    if(isNaN(args[1]))
    {
        msg.reply("not a number. Try again.");
        return;
    }

    if((Number(args[1])-1) == JobIndex)
    {
        JobChannel.send("The communist revolution is successful.\n***CLUELESS TEAM WINS!!***\n" + JRevealRoles());
    }
    else
    {
        JobChannel.send("The communist revolution fails.\n***THE EXPERT & INTERVIEWER WIN!!***\n" + JRevealRoles() + "\nThe job position was:" + PossibleJobs[JobIndex]);
    }
    JobChannel.send(GetTranscript());
    BotStatus = STATUS.READY;
}

function JRevealRoles()
{
    var RolesStr = "";
    for(var i = 0; i < JPlayers.length; i++)
    {
        RolesStr = RolesStr + JPlayers[i][1].displayName + " was " + JPlayers[i][2] + "\n";
    }
    return RolesStr;
}

function GetSpeakerIndex(idx)
{
    var ReturnVal=CurrentSpeaker;
    for(i = 0; i < idx; i++)
    {
        ReturnVal = mod(1 + ReturnVal, JPlayers.length);
        if(JPlayers[ReturnVal][2] == JOBROLES.INTERVIEWER) ReturnVal = mod(1 + ReturnVal, JPlayers.length);
    }
    return ReturnVal;
}

function GetTranscript()
{
    var ReturnStr = "```";
    for(var i = 0; i < Transcript.length;i++)
    {
        ReturnStr = ReturnStr + "Q:" + Transcript[i][0] + "\n";
        ReturnStr = ReturnStr + "A:" + Transcript[i][1] + "\n\n";

    }
    ReturnStr = ReturnStr + "```";
    return ReturnStr;
}

///
///Decrypto
///

const DECRYPTOSTATE = 
{
    JOIN: 'join',
    GAME_READY: 'gameready',
    CLUE: 'clue',
    GUESS_ENEMY: 'guess enemy',
    GUESS_OWN: 'guess own'
}

var DecryptoChannel;

var DState;
var DPlayers;
var DCluers;
var DWords;
var DTeamSymbols;
var DSequences;
var DClues;
var DRound;
var DVotes;
var DPoints;
var DEnemyGuesses;
var DPreviousClues;

function InitDecrypto()
{
    DState = DECRYPTOSTATE.JOIN;
    DPlayers = [];
    DCluers = [0,0];
    DWords = [['','','',''],['','','','']]//each team's words
    DTeamSymbols = ['',''];
    DSequences = [[],[]];
    DClues = ['',''];
    DRound = 1;
    DPoints = [[0,0],[0,0]]//format [Intercepts, Miscoms];
    DEnemyGuesses = [[],[]];
    DPreviousClues = [[[],[],[],[]],[[],[],[],[]]]//Clues[team][number]
}

function JoinDecrypto(msg)
{
    if(msg.channel !== DecryptoChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(DState == DECRYPTOSTATE.JOIN)
    {

        if(!ArrSearch(DPlayers, msg.author.id))
        {
            DPlayers.push([msg.author.id, msg.member]);
            DecryptoChannel.send(msg.member.displayName + " has joined the game.");
        }
        else
        {
            msg.reply("looks like you are already part of the game.");
        }
    }
    else
    {
        msg.channel.send("You can't join; the game is already in progress.");
    }
}

function WhoDecrypto(msg)
{
    if(DState == DECRYPTOSTATE.JOIN)
    {
        WhoGame(DPlayers, msg);
    }
    else
    {
        msg.channel.send("Players on team "+ DTeamSymbols[0] +":");
        WhoGame(DPlayers[0], msg);
        msg.channel.send("Players on team "+ DTeamSymbols[1] +":");
        WhoGame(DPlayers[1], msg);
    }
}

function StartDecrypto(msg)
{
    if(msg.channel !== DecryptoChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(DPlayers.length < 4)
    {
        msg.reply("can't start game! Need at least 4 players.");
        return;
    }

    if(DState !== DECRYPTOSTATE.JOIN)
    {
        msg.reply("the game of decrypto has already started.");
        return;
    }
    DState = DECRYPTOSTATE.GAME_READY;
    var StartMessage = "---------\nThe game has begun\n---------\n\n";
    
    //decide teams
    shuffle(DPlayers);
    var TempPlayers = [[],[]];
    for(var i = 0; i < DPlayers.length; i++)
    {
        if(i <= (DPlayers.length/2 - 1))
        {
            TempPlayers[0].push(DPlayers[i]);
        }
        else
        {
            TempPlayers[1].push(DPlayers[i]);
        }
    }
    DPlayers = TempPlayers;

    //generate team names
    DTeamSymbols[0] = emojis.randomemoji();
    do 
    {
        DTeamSymbols[1] = emojis.randomemoji();
    }
    while (DTeamSymbols[1] == DTeamSymbols[0]);
    

    //display teams
    StartMessage = StartMessage + "Team " + DTeamSymbols[0] + " is :\n"
    for(var i = 0; i < DPlayers[0].length; i++)
    {
        StartMessage = StartMessage + DPlayers[0][i][1].displayName + "\n";
    }

    StartMessage = StartMessage + "Team " + DTeamSymbols[1] + " is :\n"
    for(var i = 0; i < DPlayers[1].length; i++)
    {
        StartMessage = StartMessage + DPlayers[1][i][1].displayName + "\n";
    }

    StartMessage = StartMessage + "\nEach team should now have their words. The two teams should go to separate voice channels.";
    DecryptoGiveWords();
    DecryptoChannel.send(StartMessage);
    DState = DECRYPTOSTATE.CLUE;
    BreifCluers();
}

async function DecryptoGiveWords()
{
    //generate words
    var Words;
    try
    {
        Words = fs.readFileSync('./CommonWords.txt', 'utf8');
    }
    catch (err)
    {
        console.error(err);
        CloseBot();
    }
    Words = Words.split(/\r?\n/);//split by new line
    //Set words
    for(var t = 0; t <= 1; t++)
    {
        DWords[t][0] = RandEle(Words);
        do { DWords[t][1] = RandEle(Words); }while(DWords[t][1] == DWords[t][0])
        do { DWords[t][2] = RandEle(Words);}while(DWords[t][2] == DWords[t][0] || DWords[t][2] == DWords[t][1])
        do { DWords[t][3] = RandEle(Words);}while(DWords[t][3] == DWords[t][0] || DWords[t][3] == DWords[t][1] || DWords[t][3] == DWords[t][2])
    }

    //Send out DMs
    for(var t = 0; t <= 1; t++)
    {
        for(var p = 0; p < DPlayers[t].length;p++)
        {
            var WordsMessage = "========================\nYour team's words are:\n";
            for(var w = 0; w < 4; w++)
            {
                WordsMessage = WordsMessage + DigitToEmoji(w+1) + DWords[t][w] + "\n";
            }
            WordsMessage = WordsMessage + "========================";
            DPlayers[t][p][1].send(WordsMessage);
        }
    }

    
}

function BreifCluers()
{
    //generate sequences
    for(var t = 0; t <= 1; t++)
    {
        DSequences[t] = shuffle([0,1,2,3]).splice(0,3);
        var sequenceStr = "Your sequence is:\n";
        for(var i = 0; i < DSequences[t].length;i++)
        {
            sequenceStr = sequenceStr + DigitToEmoji(DSequences[t][i]+1) + " ";
        }
        sequenceStr = sequenceStr + "Clues must reference the meaning of the words and not the numbers.\nType !clue to give your clues, separating each with commas\nE.g. !clue Frank, Transverse, Salt";
        DPlayers[t][DCluers[t]][1].send(sequenceStr);
    }

    var GlobalMessage = "Starting round " + DRound + "\n";
    GlobalMessage = GlobalMessage + ShowTeamsTokens();
    for(var t = 0; t <= 1; t++)
    {
        GlobalMessage = GlobalMessage + "<@!" + DPlayers[t][DCluers[t]][1].id +"> is giving clues for team " + DTeamSymbols[t] + ".\n";
    }
    DecryptoChannel.send(GlobalMessage);
    if(DRound != 1)
    {
        DecryptoChannel.send(CreatePrevCluesEmbed(0));
        DecryptoChannel.send(CreatePrevCluesEmbed(1));
    }
}

function DecryptoGetMsgSender(msg)
{
    var CluedTeam = -1;
    var CluerIdx = -1;
    for(var t = 0; t <= 1; t++)
    {
        for(var p = 0; p < DPlayers[t].length; p++)
        {
            if(DPlayers[t][p][1].id == msg.author.id)
            {
                CluedTeam = t;
                CluerIdx = p;
            }
        }
    }
    
    if(CluedTeam == -1 || CluerIdx == -1)
    {
        msg.reply("you aren't in the game.");
        return;
    }

    return [CluedTeam, CluerIdx];
}

function DecryptoClue(msg)
{
    if(msg.channel != DecryptoChannel && !(msg.channel instanceof DISCORD.DMChannel))
    {
        msg.reply("please say that in the channel where the game is being played or DMs.");
        return;
    }

    if(DState != DECRYPTOSTATE.CLUE)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    var PlayerIdentity = DecryptoGetMsgSender(msg);
    var CluedTeam = PlayerIdentity[0];
    var CluerIdx = PlayerIdentity[1];
    

    if(DClues[CluedTeam] != '')
    {
        msg.reply("you have already given a clue");
        return;
    }
    
    

    if(msg.content.length <= 5)
    {
        msg.reply("can't give an empty clue");
        return;
    }

    if(CluerIdx != DCluers[CluedTeam])
    {
        msg.replace("*you* aren't supposed to be giving clues.");
        return;
    }

    var GivenClues = msg.content.split(' ').slice(1).join(' ');
    GivenClues = GivenClues.replace(/, /g, ",");
    GivenClues = GivenClues.split(",");

    if(GivenClues.length != 3)
    {
        msg.reply("error! Did you give more than 3 clues?\nTry something like !clue Frank, Transverse, Salt");
        return;
    }

    DClues[CluedTeam] = GivenClues;

    DecryptoChannel.send("Team " + DTeamSymbols[CluedTeam] + "'s clues are:" + GivenClues.toString());

    for(var t = 0; t <= 1; t++)
    {
        if(DClues[t] == '') return; 
    }
    
    //proceed to guessing
    if(DRound == 1)//skip enemy guessing on round 1
    {
        DState = DECRYPTOSTATE.GUESS_OWN;
        BreifGuessOwn();
    }
    else
    {
        DState = DECRYPTOSTATE.GUESS_ENEMY;
        BreifGuessEnemy();
    }

}

function BreifGuessEnemy()
{
    DVotes = [0,0];
    DecryptoChannel.send("==========================\nIt is now time for you to guess ***the opposite team's*** sequence.\nType !guess to make a guess at the opponent's sequence\nE.G. !guess 1, 2, 4");
    DecryptoChannel.send(CreatePrevCluesEmbed(0));
    DecryptoChannel.send(CreatePrevCluesEmbed(1));
}

function BreifGuessOwn()
{
    DVotes = [0,0];
    DecryptoChannel.send("==========================\nIt is now time for you to guess ***your own team's*** sequence.\nType !guess to make a guess at the sequence\nE.G. !guess 1, 2, 4");
}

function DecryptoGuess(msg)
{
    if(msg.channel != DecryptoChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    var GuessSeq = msg.content.split(' ').slice(1).join(' ');
    GuessSeq = GuessSeq.replace(/, /g, ",");
    GuessSeq = GuessSeq.split(",");

    if(GuessSeq.length != 3)
    {
        msg.reply("error! Does your sequence have 3 numbers?\nPlease try again.");
        return;
    }


    for(var i = 0; i < GuessSeq.length; i++)
    {
        if(isNaN(Number(GuessSeq[i])))
        {
            msg.reply("error! Could not decipher numbers.\nPlease try again."); 
            return;
        }
        var MyNumber = Number(GuessSeq[i]);
        if(MyNumber > 4 || MyNumber < 1)
        {
            msg.reply("error! Numbers should be 1 to 4.\nPlease try again.");
            return;
        }

        if(!Number.isInteger(MyNumber))
        {
            msg.reply("error! Numbers must be whole numbers.\nPlease try again.");
            return;
        }
        GuessSeq[i] = MyNumber-1;
    }
    if(hasDuplicates(GuessSeq))
    {
        msg.reply("sequence has duplicates! Please try again.");
        return;
    }

    var GuessTeam = DecryptoGetMsgSender(msg)[0];

    if(DState == DECRYPTOSTATE.GUESS_ENEMY)
    {
        DecryptoEnemyGuess(GuessTeam, GuessSeq);
    }
    else if(DState == DECRYPTOSTATE.GUESS_OWN)
    {
        DecryptoOwnGuess(GuessTeam, GuessSeq);
    }
    else
    {
        msg.reply("there's a time and place for everything. But not now!");
    }
}

function DecryptoEnemyGuess(team, sequence)
{
    if(DVotes[team] == 1)
    {
        DecryptoChannel.send("Team " + DTeamSymbols[team] + " has already submitted their guess for the enemy's sequence.");
        return;
    }
    var EmemyGuessStr = "Team " + DTeamSymbols[team] + " has guessed the enemy's sequence is:";
    for(var i = 0; i < sequence.length; i++)
    {
        EmemyGuessStr = EmemyGuessStr + (sequence[i]+1) + " "
    }
    DVotes[team] = 1;
    DecryptoChannel.send(EmemyGuessStr);
    DEnemyGuesses[team] = sequence;

    for(var t = 0; t <= 1; t++)
    {
        if(DVotes[t] == 0) return;
    }
    DState = DECRYPTOSTATE.GUESS_OWN;
    BreifGuessOwn();
}

function DecryptoOwnGuess(team, sequence)
{
    if(DVotes[team] == 1)
    {
        DecryptoChannel.send("Team " + DTeamSymbols[team] + " has already submitted their guess for their own sequence.");
        return;
    }

    if(ArrayEquals(DSequences[team],sequence))
    {
        DecryptoChannel.send("Team " + DTeamSymbols[team] + " has communicated properly.:ok:");
    }
    else
    {
        var TrueSeq = "";
        for(var i = 0; i < DSequences[team].length;i++)
        {
            if(DSequences[team][i] != sequence[i]) DClues[team][i] = "# __" + DClues[team][i] + "__ #";//underline miscommunicated words
            TrueSeq = TrueSeq + (DSequences[team][i] + 1).toString() + " ";
        }
        DecryptoChannel.send("Team " + DTeamSymbols[team] + " has miscommunicated!:x:\nThe real sequence was " + TrueSeq);
        DPoints[team][1]++;//add one miscommunication.
    }
    DVotes[team] = 1;

    for(var t = 0; t <= 1; t++)
    {
        if(DVotes[t] == 0) return;
    }
    //resolve intercepts
    for(var t = 0; t <= 1; t++)
    {
        if(ArrayEquals(DEnemyGuesses[t], DSequences[1-t]))
        {
            DecryptoChannel.send("Team " + DTeamSymbols[t] + " has intercepted!:eye:");
            DPoints[t][0]++;//add one intercept.
        }
    }
    //Add the clues to the previous clues.
    for(var t = 0; t <= 1; t++)
    {
        for(var i = 0; i < DSequences[t].length; i++)
        {
            DPreviousClues[t][DSequences[t][i]].push(DClues[t][i]);
        }
    }
    //resolve round end
    if(DecryptoCheckGameEnd())//if the game is over
    {
        BotStatus = STATUS.READY;
        DecryptoChannel.send(CreatePrevCluesEmbed(0));
        DecryptoChannel.send(CreatePrevCluesEmbed(1));
        return;
    }
    //otherwise, carry on.
    for(var t = 0; t <= 1; t++)
    {
        DCluers[t] = mod(DCluers[t]+1,DPlayers[t].length);//move the cluers over
    }
    DSequences = [[],[]];//refresh sequences
    DEnemyGuesses = [[],[]];
    DClues = ['',''];//refresh clues
    DRound++;
    DState = DECRYPTOSTATE.CLUE;
    BreifCluers();
}

function DecryptoCheckGameEnd()
{
    var WinnerMatrix = [[-1,0,0],[1,-1,0],[1,1,-1]];
    var DWinnerStates = [1,1];//0 is a loss, 1 is a tie, 2 is a win.
    var GameOver = false;
    var DTeamTotals = [0,0];
    if(DRound == 8) GameOver = true;
    for(var t = 0; t <= 1; t++)//check each team
    {
        DTeamTotals[t] = DPoints[t][0]-DPoints[t][1];//intercepts - miscoms
        if(DPoints[t][0] >= 2 && DPoints[t][0] >= 2)
        {
            DWinnerStates[t] = 1;//you are tied
            GameOver = true;
        }
        else if(DPoints[t][0] >= 2)//if #intercepts is 2
        {
            DWinnerStates[t] = 2;
            GameOver = true;
        }
        else if(DPoints[t][1] >= 2)//if #miscoms is 2
        {
            DWinnerStates[t] = 0;
            GameOver = true;
        }
    }
    if(!GameOver)
    {
        return false;
    }

    var GameEndMessage = ShowTeamsTokens() + "\n=============================\nThe game is over!\n";
    var Winner = WinnerMatrix[DWinnerStates[1]][DWinnerStates[0]];
    if(Winner != -1)
    {
        GameEndMessage = GameEndMessage + "Team " + DTeamSymbols[Winner] + " have won!:confetti_ball:";
        DecryptoChannel.send(GameEndMessage);
        return true;
    }
    if(DTeamTotals[1] == DTeamTotals[0])
    {
        GameEndMessage = GameEndMessage + "It's a tie! The two teams must now guess each others words. Unfortunately, I can't handle this, as I don't have sentience(blame August for not being good enough at Javascript).\nIt's up to the human players to decide if guesses are close enough.";
        DecryptoChannel.send(GameEndMessage);
        return true;
    }
    else if(DTeamTotals[1] > DTeamTotals[0])
    {
        GameEndMessage = GameEndMessage + "Team " + DTeamSymbols[1] + " have won!:confetti_ball:";
        DecryptoChannel.send(GameEndMessage);
        return true;
    }
    else
    {
        GameEndMessage = GameEndMessage + "Team " + DTeamSymbols[0] + " have won!:confetti_ball:";
        DecryptoChannel.send(GameEndMessage);
        return true;
    }
}

function ShowTeamsTokens()
{
    var TeamsTokensStr = "";
    for(var t = 0; t <= 1; t++)
    {
        TeamsTokensStr = TeamsTokensStr +  "Team " + DTeamSymbols[t] + " have:\n";
        if(DPoints[t][0] == 1)
        {
            TeamsTokensStr = TeamsTokensStr + DPoints[t][0] + "  intercept:green_circle:.\n"
        }
        else
        {
            TeamsTokensStr = TeamsTokensStr + DPoints[t][0] + "  intercepts:green_circle:.\n"
        }

        if(DPoints[t][1] == 1)
        {
            TeamsTokensStr = TeamsTokensStr + DPoints[t][1] + "  miscommunication:red_circle:.\n"
        }
        else
        {
            TeamsTokensStr = TeamsTokensStr + DPoints[t][1] + "  miscommunications:red_circle:.\n"
        }
    }
    return TeamsTokensStr;
}

function CreatePrevCluesEmbed(team)
{
    var CluesEmbed = new DISCORD.MessageEmbed()
	.setColor('#FEFEFE')
	.setTitle("Previous Clues")
    .setAuthor("Team", "https://emoji.beeimg.com/" + DTeamSymbols[team]);

    for(var i = 0; i < DPreviousClues[team].length;i++)
    {
        if(DPreviousClues[team][i].length != 0)
            CluesEmbed.addField("Clues for word " + (i+1).toString(), DPreviousClues[team][i].join("\n"), true);
    }
    return CluesEmbed;
}

///
/// Countdown
///

const Vowels = ["a","a","a","a","a","a","a","a","a","a","a","a","a","a", "e","e","e","e","e","e","e","e","e","e","e","e","e","e","e","e","e","e","e", "i", "i", "i", "i", "i", "i", "i", "i", "i", "i", "i", "i",  "o","o","o","o","o","o","o","o","o","o","o","o", "u", "u", "u", "u", "u"];
const Consonants = ["b","b","c","c","c","d","d","d","d","d","f","f","g","g","g","h","h","j","k","l","l","l","l","m","m","m","n","n","n","n","n","n","p","p","p","p","q","r","r","r","r","r","r","r","s","s","s","s","s","s","t","t","t","t","t","t","t","v","w","x","x","y","z"];


var CountdownChannel;
var CountdownMsg;
var CountdownLetters;
var CDTimeLeft;
var CDUpdater;
var BestWord;

async function InitCountdown(channel, settings)
{
    CountdownLetters = [];
    CountdownChannel = channel;
    var VowelNo = 4;
    CDTimeLeft = 30;//30 seconds.
    BestWord = ['',''];//Format: USER, WORD

    if(typeof(settings[1]) != "undefined" && !isNaN(settings[1]))
    {
        CDTimeLeft = Math.floor(Math.max(5,Number(settings[1])));
    }
    if(typeof(settings[2]) != "undefined" && !isNaN(settings[2]))
    {
        VowelNo = Math.floor(Math.max(0,Number(settings[2])));
    }

    for(var i = 0; i < 9; i++)//add letters
    {
        if(i < VowelNo)//add vowel
        {
            CountdownLetters.push(RandEle(Vowels));
        }
        else
        {
            CountdownLetters.push(RandEle(Consonants));
        }
    }
    if(Math.random() >= (0.40)) CountdownLetters[0] = "*";//add wildcard
    shuffle(CountdownLetters);
    CountdownMsg = await CountdownChannel.send(CDMessage());
    CDUpdater = setInterval(UpdateTime, 5000);
}

function UpdateTime()
{
    CDTimeLeft -= 5;
    CDTimeLeft = Math.max(CDTimeLeft, 0);
    CountdownMsg.edit(CDMessage());
    if(CDTimeLeft <= 0)
    {
        clearInterval(CDUpdater);//stop updating this
        CDEndGame();
    }
}

function CDMessage()
{
    var ReturnMsg = "A game of countdown :clock: is starting in #" + CountdownChannel.name + ".\nYou have " + CDTimeLeft + " seconds.\nThe letters are:";
    
    for(var i = 0; i < CountdownLetters.length; i++)
    {
        ReturnMsg = ReturnMsg + LetterToEmoji(CountdownLetters[i].toLowerCase()) + " ";
    }
    return ReturnMsg;
}

function CDWord(msg, subword)
{
    var word = subword.toLowerCase();

    if(msg.channel != CountdownChannel && !(msg.channel instanceof DISCORD.DMChannel))
    {
        return;
    }

    if (!(/^[a-zA-Z]+$/.test(word)))
    {
        msg.reply("please only use letters, no other symbols allowed.");
        return;
    }

    var PotentialLetters = CountdownLetters.slice();
    var NumLettersMissing = 0;
    for (var i = 0; i < word.length; i++) //check if word uses valid letters.
    {
        var MyChar = word.charAt(i);
        if(!PotentialLetters.includes(MyChar))
        {
            NumLettersMissing++;
            continue;
        }
        var LetterIdx = PotentialLetters.indexOf(MyChar);
        PotentialLetters.splice(LetterIdx,1);//remove letter from pool.
    }

    if(NumLettersMissing > 0)
    {
        if(!(NumLettersMissing == 1 && CountdownLetters.includes("*")))
        {
            msg.reply("you can't make that word with these letters.");
            return;
        }
    }
    
    if(word.length < BestWord[1].length)//check if it's the new best
    {
        msg.reply("someone has already found a better word.");
        return;
    }
    else if(word.length == BestWord[1].length)
    {
        msg.reply("someone has found an equally long word.");
        return;
    }
    
    if(!COUNTDOWN.word_in_dictionary(word))
    {
        msg.reply("could not find word in dictionary");
        return;
    }
    
    //Make word new best
    BestWord[0] = msg.member;
    BestWord[1] = word;
    msg.reply("that word is the new best word.");
}

function CDEndGame()
{
    var CDMessage = "The game of countdown is over.\n";
    if(BestWord[1] == '')
    {
        CDMessage = CDMessage + "Nobody found a word in time.";
    }
    else
    {
        CDMessage = CDMessage + ":confetti_ball:" + BestWord[0].displayName + " won the game with the word \"" + BestWord[1] + "\".:confetti_ball:";
        if(BestWord[1].length > 6)
        {
            CDMessage = CDMessage + CDMoneyReward(BestWord[0]);
        }
    }

    var result = [];
    if(CountdownLetters.includes("*"))
    {
        var WildIndex = CountdownLetters.indexOf("*");
        for(var iChar = 97; iChar <= 122; iChar++)
        {
            CountdownLetters[WildIndex] = String.fromCharCode(iChar);
            COUNTDOWN.solve_letters(CountdownLetters.join(""), function(word, c) { result.push([word, c]); });
        }
    }
    else
    {
        COUNTDOWN.solve_letters(CountdownLetters.join(""), function(word, c) { result.push([word, c]); });
    }

    result.sort(function(a, b) {
        if (b[0].length != a[0].length)
            return b[0].length - a[0].length;
        else
            return b[1] - a[1];
    });

    var BestWordStr = "";
    if(typeof(result[0][0]) == "undefined")
    {
        BestWordStr = "?????CANT FIND????";
    }
    else
    {
        for(var i = 0; i < result[0][0].length; i++)
        {
            BestWordStr = BestWordStr + LetterToEmoji(result[0][0].charAt(i)) + " ";
        }
    }

    
    CountdownChannel.send(CDMessage + "\nExample of best word: " + BestWordStr);
    BotStatus = STATUS.READY;
}

function CDMoneyReward(winner)
{
    var BankMessage = "";
    for(var iAcc = 0; iAcc < BankAccounts.length; iAcc++)
    {
        if(winner.id == BankAccounts[iAcc][0])
        {
            if(BankAccounts[iAcc][1] < 8)
            {
                BankAccounts[iAcc][1] = 8;
                BankMessage = "\n" + BankMessage + winner.displayName + " has been reimbursed and now has 8$ in their account.:dollar:";
            }
        }
    }

    SaveAccounts();
    return BankMessage;
}

///
///Avalon
///

const AVALONSTATE = 
{
    JOIN: 'join',
    GAME_READY: 'gameready',
    KING: 'king',
    MISSION_VOTE: 'mission vote',
    MISSION_PASS_FAIL: 'mission pass fail',
    LADY: 'lady',
    ASSASSINATE: 'assassinate',
    GAME_END: 'game end'
}

const AVALONROLES = 
{
    NGOOD : "Neutral good:slight_smile:",
    MERLIN : "Merlin:man_mage:",
    PERCIVAL : "Percival:man_police_officer:",
    MORGANA : "Morgana:woman_detective:",
    MORDRED: "Mordred:japanese_ogre:",
    OBERON: "Oberon:clown:",
    ASSASSIN: "Assassin:vampire:",
    NEVIL: "Neutral evil:japanese_goblin:",
    JEFFERY: "Jeffery:genie:",
    GLANCELOT: "The good Lancelot:superhero:",
    BLANCELOT: "The evil Lancelot:supervillain:"
}

const EvilPresets = [
                    [],                      //0 players
                    [AVALONROLES.MORGANA],   //1 player
                    [AVALONROLES.MORGANA],   //2 players
                    [AVALONROLES.MORGANA],   //3 players, 1 evil
                    [AVALONROLES.MORGANA],  //4 players, 1 evil
                    [AVALONROLES.MORGANA, AVALONROLES.ASSASSIN],//5 players, 2 evil
                    [AVALONROLES.MORGANA, AVALONROLES.MORDRED],//6 players, 2 evil
                    [AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.OBERON],//7 players, 3 evil
                    [AVALONROLES.MORGANA, AVALONROLES.MORDRED, AVALONROLES.OBERON],//8 players, 3 evil
                    [AVALONROLES.MORGANA, AVALONROLES.MORDRED, AVALONROLES.ASSASSIN],//9 players, 3 evil
                    [AVALONROLES.MORGANA, AVALONROLES.MORDRED, AVALONROLES.OBERON, AVALONROLES.ASSASSIN]//10 players, 3 evil
];

const GoodPreset = [AVALONROLES.MERLIN, AVALONROLES.PERCIVAL];

const MissionPresets = [
                        [],//0 players
                        [],//1 player
                        [],//2 players
                        [2,2,2,2,1],//3 players
                        [2,2,2,2,2],//4 players
                        [2,3,2,3,3],//5 players
                        [2,3,4,3,4],//6 players
                        [2,3,3,4,4],//7 players
                        [3,4,4,5,5],//8 players
                        [3,4,4,5,5],//9 players
                        [3,4,4,5,5]
]

var AvalonChannel;
var AvalonSFXConnection;

var AState;
var APlayers;
var AEvilList;
var AGoodList;

var AMissions;
var AMissionIdx;
var AKingStage;
var AKingIndex;
var ALadyIndex;
var AAssassinIndex;
var AMissionPeople;
var AVotes;
var PreviousLadies;
var PreviousMissions;
var PrevKings;
var IsLancelot;
var LancelotDeck;


function InitAvalon()
{
    AState = AVALONSTATE.JOIN;
    APlayers = [];//Start with no players
    AEvilList = [];
    AGoodList = [];
    AMissions = [false,false,false,false,false];//All missions start failed :<
    AMissionIdx = 0;
    AKingStage = 1;
    AKingIndex = 0;
    ALadyIndex = 0;
    AAssassinIndex = 0;
    AMissionPeople = [];
    AVotes = [];
    PreviousLadies = [];
    PreviousMissions = [];
    PrevKings = [];
    IsLancelot = false;
    LancelotDeck = [false,false,false,true,true];
}

async function AvalonSfx(msg)
{
    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(AvalonSFXConnection)
    {
        await AvalonSFXConnection.channel.leave();
        AvalonSFXConnection = null;
        AvalonChannel.send("Sound effects: OFF.");
        return;
    }

    var Message = "";
    if(msg.guild)
    {
        if (msg.member.voice.channel) 
        {
            AvalonSFXConnection = await msg.member.voice.channel.join();
            AvalonChannel.send("Sound effects: ON.");
            return;
        } 
        else 
        {
            Message = Message + "you need to be in a voice channel to do that.";
        }
    }
    msg.reply("connection failed.");

}

function JoinAvalon(msg)
{
    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(AState == AVALONSTATE.JOIN)
    {
        if(APlayers.length >= 10)
        {
            msg.reply("no more space for players.")
        }
        if(!ArrSearch(APlayers, msg.author.id))
        {
            APlayers.push([msg.author.id, msg.member,'','']);
            AvalonChannel.send(msg.member.displayName + " has joined the game.");
        }
        else
        {
            msg.reply("looks like you are already part of the game.");
        }
    }
    else
    {
        msg.channel.send("You can't join; the game is already in progress.");
    }

}

function PlaySFX(path)
{
    try
    {
    var dispatcher = AvalonSFXConnection.play(path);
    dispatcher.setVolume(0.1); 
    dispatcher.on('finish', () => {
        dispatcher.destroy(); 
      });
    }
    catch(err)
    {
        console.error(err);
        AvalonChannel.send("Error playing sound effect.");
    }
}

function WhoAvalon(msg)
{
    msg.channel.send("Players currently in the game:");
    var PlayerList = "";
    for (i = 0; i < APlayers.length; i++) 
    {
        PlayerList =  PlayerList + " " + APlayers[i][1].displayName + " |";
    }
    msg.channel.send(PlayerList);
}

function DeclareRoles(msg)
{
    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(AState == AVALONSTATE.JOIN)
    {
        var noSpace = msg.content.replace(/\s+/g, " ");
        var args = noSpace.substring(config.prefix.length).split(" ");
        AEvilList = [];
        AGoodList = [];
        for (i = 1; i < args.length; i++) 
        {
            switch(args[i].toLowerCase())
            {
                case "help":
                    msg.channel.send("Declare evil roles you definitely want in the game, if left unspecified it will be automatic.\ne.g. !evil oberon morgana mordred");
                    break;
                case "oberon":
                    AEvilList.push(AVALONROLES.OBERON);
                    break;
                case "morgana":
                    AEvilList.push(AVALONROLES.MORGANA);
                    break;
                case "mordred":
                    AEvilList.push(AVALONROLES.MORDRED);
                    break;
                case "assassin":
                    AEvilList.push(AVALONROLES.ASSASSIN);
                    break;
                case "nevil":
                    AEvilList.push(AVALONROLES.NEVIL);
                    break;
                case "ngood":
                    AGoodList.push(AVALONROLES.NGOOD);
                    break;
                case "percival":
                    AGoodList.push(AVALONROLES.PERCIVAL);
                    break;
                case "merlin":
                    AGoodList.push(AVALONROLES.MERLIN);
                    break;
                case "jeffery":
                    AGoodList.push(AVALONROLES.JEFFERY);
                    break;
                case "lancelot":
                    AGoodList.push(AVALONROLES.GLANCELOT);
                    AEvilList.push(AVALONROLES.BLANCELOT);
                    break;
            }
        }
        var Message = "";
        Message = Message + ("The current evil people are: " + AEvilList.toString() + "\n");
        Message = Message + ("The current good people are: " + AGoodList.toString() + "\n");
        Message = Message + ("Additional roles will be added automatically if needed.");
        AvalonChannel.send(Message);
    }
    else
    {
        msg.channel.send("The game has already started, roles can't be decreed.");
    }
}

function GetAvalonRoles()
{
    var ReturnRoles = [];
    var NumOfEvil = EvilPresets[APlayers.length].length;
    for(var i = 0; i < NumOfEvil; i++)//fill in evil roles
    {
        if(i < AEvilList.length)
        {
            ReturnRoles.push(AEvilList[i]);
        }
        else
        {
            ReturnRoles.push(EvilPresets[APlayers.length][i - AEvilList.length]);
        }
    }

    for(var i = 0; i < (APlayers.length - NumOfEvil); i++)//fill in evil roles
    {
        if(i < AGoodList.length)
        {
            if(AGoodList[i] == AVALONROLES.JEFFERY)
            {
                if(Math.random() < 0.5)
                {
                    AGoodList[i] = AVALONROLES.MERLIN;//replace with normal merlin
                }
            }
            ReturnRoles.push(AGoodList[i]);
        }
        else
        {
            if(!ReturnRoles.includes(AVALONROLES.MERLIN) && !ReturnRoles.includes(AVALONROLES.JEFFERY))
            {
                ReturnRoles.push(AVALONROLES.MERLIN);
            }
            else if(!ReturnRoles.includes(AVALONROLES.PERCIVAL))
            {
                ReturnRoles.push(AVALONROLES.PERCIVAL);
            }
            else
            {
                ReturnRoles.push(AVALONROLES.NGOOD);
            }
        }
    }

    return ReturnRoles;
}

function StartAvalon(msg)//now that everyone has joined and evil are declared, the night needs to start.
{

    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(APlayers.length < 3)
    {
        msg.reply("can't start game! Need at least 3 players.");
        return;
    }

    if(AState !== AVALONSTATE.JOIN)
    {
        msg.reply("the game of avalon has already started.");
        return;
    }
    AState = AVALONSTATE.GAME_READY;
    
    var StartMessage = "---------\nThe game is about to begin\n---------\n\n";
    
    //Get roles
    Roles = GetAvalonRoles();

    StartMessage = StartMessage + "The following roles are in the game:\n";
    for(var i = 0; i < Roles.length; i++)
    {
        //TODO
        if(Roles[i] == AVALONROLES.JEFFERY)
        {
            StartMessage = StartMessage + AVALONROLES.MERLIN + "\n";
        }
        else
        {
            StartMessage = StartMessage + Roles[i] + "\n";
        }
    }
    if(Roles.includes(AVALONROLES.GLANCELOT) || Roles.includes(AVALONROLES.BLANCELOT))
    {
        IsLancelot = true;
        shuffle(LancelotDeck);
    }
    shuffle(Roles);
    shuffle(APlayers);
    //Give roles
    for(var i = 0; i < Roles.length; i++)
    {
        APlayers[i][2] = Roles[i];//assing roles
        if([AVALONROLES.MERLIN, AVALONROLES.NGOOD, AVALONROLES.PERCIVAL, AVALONROLES.JEFFERY, AVALONROLES.GLANCELOT].includes(Roles[i]))
        {
            APlayers[i][3] = false;
        }
        else
        {
            APlayers[i][3] = true;
        }
    }

   

    var JefferyNumber = 0;

    for(var j = 0; j < APlayers.length; j++)
    {
        if([AVALONROLES.NEVIL, AVALONROLES.OBERON, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
        {
            JefferyNumber++;
        }   
    }
    //Send DMs with info.
    for(var i = 0; i < APlayers.length; i++)
    {
        var SpecialMessage = "";
        switch(APlayers[i][2])
        {
            case AVALONROLES.MERLIN:
                SpecialMessage = "You are Merlin!\n:man_mage:\nThe following people are evil:\n";
                for(var j = 0; j < APlayers.length; j++)
                {
                    if([AVALONROLES.NEVIL, AVALONROLES.OBERON, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
                    {
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName + "\n";
                    }   
                }
                SpecialMessage = SpecialMessage + "\nDon't tell people you are merlin!";
                break;
            case AVALONROLES.JEFFERY:
                SpecialMessage = "You are Merlin!\n:man_mage:\nThe following people are evil:\n";
                var JeffCount = JefferyNumber;
                for(var j = 0; j < APlayers.length; j++)
                {
                    if(i == j) continue;
                    if(!APlayers[j][3])//good people
                    {
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName + "\n";
                        JeffCount--;
                    }

                    if(JeffCount == 0)
                    {
                        break;
                    }
                }
                SpecialMessage = SpecialMessage + "\nDon't tell people you are merlin!";
                break;
            case AVALONROLES.PERCIVAL:
                SpecialMessage = "You are Percival!\n:man_police_officer:\nThe following people are Morgana or Merlin:\n";
                for(var j = 0; j < APlayers.length; j++)
                {
                    if([AVALONROLES.MERLIN, AVALONROLES.MORGANA, AVALONROLES.JEFFERY].includes(APlayers[j][2]))
                    {
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName + "\n";
                    }
                }
                SpecialMessage = SpecialMessage + "\nDon't tell people who is merlin!";
                break;
            case AVALONROLES.MORDRED:
                SpecialMessage = "You are Mordred!\n:japanese_ogre:\nThe following people are your evil buddies:\n";
                for(var j = 0; j < APlayers.length; j++)
                {

                    if([AVALONROLES.NEVIL, AVALONROLES.MORDRED, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
                    {
                        if(i == j) continue;
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName + "\n";
                    }
                }
                SpecialMessage = SpecialMessage + "\nJust act clueless.";
                break;
            case AVALONROLES.MORGANA:
                SpecialMessage = "You are Morgana!\n:woman_detective:\nThe following people are your evil buddies:\n";
                for(var j = 0; j < APlayers.length; j++)
                {
                    if([AVALONROLES.NEVIL, AVALONROLES.MORDRED, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
                    {
                        if(i == j) continue;
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName  + "\n";
                    }
                }
                SpecialMessage = SpecialMessage + "\nReject everything and Percival will think you are Merlin.";
                break;
            case AVALONROLES.ASSASSIN:
                SpecialMessage = "You are the Assassin!\n:vampire:\nThe following people are your evil buddies:\n";
                for(var j = 0; j < APlayers.length; j++)
                {
                    if([AVALONROLES.NEVIL, AVALONROLES.MORDRED, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
                    {
                        if(i == j) continue;
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName  + "\n";
                    }
                }
                SpecialMessage = SpecialMessage + "\nAct good and wait for someone do accuse you.";
                break;
            case AVALONROLES.OBERON:
                SpecialMessage = "You are the Oberon!\n:clown:\nPass every mission and act good.\n";
                break;
            case AVALONROLES.NEVIL:
                SpecialMessage = "You are the neutral evil...\n:japanese_goblin:\nThe following people are your evil buddies:\n";
                for(var j = 0; j < APlayers.length; j++)
                {
                    if([AVALONROLES.NEVIL, AVALONROLES.MORDRED, AVALONROLES.MORGANA, AVALONROLES.ASSASSIN, AVALONROLES.BLANCELOT].includes(APlayers[j][2]))
                    {
                        if(i == j) continue;
                        SpecialMessage = SpecialMessage + APlayers[j][1].displayName  + "\n";
                    }
                }
                SpecialMessage = SpecialMessage + "\nToo bad you got this role. Better luck next time.";
                break;
            case AVALONROLES.GLANCELOT:
                SpecialMessage = "You are the good Lancelot!\n:superhero:\nYou might switch allegiance, if a swap card is drawn after the third, fourth, or fifth missions.\n";
                break;
            case AVALONROLES.BLANCELOT:
                SpecialMessage = "You are the evil Lancelot!\n:supervillain:\nYou might switch allegiance, if a swap card is drawn after the third, fourth, or fifth missions.\n";
                break;
            case AVALONROLES.NGOOD:
                SpecialMessage = "You are the neutral good!\n:slight_smile:\nAct confident and mislead your entire team.\n";
                break;
        }
        APlayers[i][1].send("-----------------\n Your Avalon secret identity \n-----------------\n" + SpecialMessage);
    }

    shuffle(APlayers);
    

     //Determine assassin
     var AssassinPriority = [AVALONROLES.ASSASSIN, AVALONROLES.MORGANA, AVALONROLES.BLANCELOT, AVALONROLES.NEVIL, AVALONROLES.MORDRED, AVALONROLES.OBERON];
     AAssassinIndex = -1;
     var PriorityIdx = 0;
     while(AAssassinIndex === -1)
     {
         for(var i = 0; i < APlayers.length; i++)
         {
             if(APlayers[i][2] === AssassinPriority[PriorityIdx])
             {
                 AAssassinIndex = i;
             }
         }
         PriorityIdx++;
         if(PriorityIdx >= AssassinPriority.length)
         {
             msg.channel.send("Error! Could not find assassin. Ending game...");
             BotStatus = STATUS.READY;
             return;
         }
     }

    AKingStage = 1;
    AKingIndex = Math.floor(Math.random() * APlayers.length);
    ALadyIndex = mod((AKingIndex - 1),APlayers.length);
    PreviousLadies.push(ALadyIndex);
    StartMessage = StartMessage + "\n\nThe first King is:" + APlayers[AKingIndex][1].displayName;
    StartMessage = StartMessage + "\n\nThe lady of the lake is:" + APlayers[ALadyIndex][1].displayName;
    StartMessage = StartMessage + "\n---------\nThe game has begun!\n---------\n\n";

    msg.channel.send(StartMessage);
    AState = AVALONSTATE.KING;
    BreifKing();    
}

function BreifKing()
{
    var KingMsgPosition = Math.floor(APlayers.length/2);
    var KingBreif = "";
    DisplayBoard();
    KingBreif = KingBreif + "Quest proposal " + AKingStage + "\n";
    KingBreif = KingBreif + "-----------------------------------------------------\n";
    for(var i = 0; i < APlayers.length; i++)
    {
        var RealIndex = mod(i + AKingIndex - KingMsgPosition, APlayers.length);
        if(RealIndex === AKingIndex)
        {
            KingBreif = KingBreif + ":crown: ";
        }
        if(RealIndex === ALadyIndex)
        {
            KingBreif = KingBreif + ":dancer: ";
        }
        if(RealIndex === mod(AKingIndex + 5 - AKingStage, APlayers.length))
        {
            if(Math.random() < 0.5)
            {
                KingBreif = KingBreif + ":man_judge: ";
            }
            else
            {
                KingBreif = KingBreif + ":woman_judge: ";
            }
        }
        KingBreif = KingBreif + APlayers[RealIndex][1].displayName +" | ";
    }

    KingBreif = KingBreif + "\n-----------------------------------------------------\n" + "This mission requires " + MissionPresets[APlayers.length][AMissionIdx] + " people.";

    if(APlayers.length >= 7 && AMissionIdx === 3)
    {
        KingBreif = KingBreif + "\n!:two:!Note this mission requires 2 fails!:two:!";
    }

    AvalonChannel.send(KingBreif);
}

function MissionAvalon(msg)
{

    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(AState != AVALONSTATE.KING)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(msg.author.id !== APlayers[AKingIndex][1].id)
    {
        msg.reply("only the king may decree a mission.");
        return;
    }

    AMissionPeople = [];

    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");

    if(hasDuplicates(args))
    {
        msg.reply("you can't put someone on the mission twice.");
        return;
    }

    for(var i = 1; i < args.length;i++)//add people to mission.
    {
        var foundPerson = false;
        var LookingFor = args[i];
        var LookingFor = args[i].replace(/[\\<>@#&!]/g, "");
        for(var j = 0; j < APlayers.length; j++)//search for each person.
        {
            if(APlayers[j][1].id == LookingFor)
            {
                AMissionPeople.push(j);
                foundPerson = true;
            }
        }

        if(!foundPerson)
        {
            AvalonChannel.send("Could not find " + args[i] + "\nPlease try again.");
            return;
        }
    }

    if(AMissionPeople.length != MissionPresets[APlayers.length][AMissionIdx])
    {
        AvalonChannel.send("The mission does have the right number of people.\nPlease try again.");
        return;
    }

    AState = AVALONSTATE.MISSION_VOTE;
    VotingBreif();
}

function VotingBreif()
{
    var MissionList = "";
    for(var i = 0; i < AMissionPeople.length; i++)
    {
        MissionList = MissionList + APlayers[AMissionPeople[i]][1].displayName+ "\n";
    }

    var MissionEmbed = new DISCORD.MessageEmbed()
	.setColor('#FF5832')
	.setTitle("Proposed Mission")
    .setAuthor(APlayers[AKingIndex][1].displayName, "https://i.imgur.com/wGaN5z0.png")
    .addField("--------", MissionList, true);
    
    AvalonChannel.send(MissionEmbed);
    AKingIndex = mod(AKingIndex + 1, APlayers.length);
    if(AKingStage < 5)
    {
        AvalonChannel.send("Please send !approve or !reject in __***direct messages***__");

        AVotes = [] //Init votes
        for(var i = 0; i < APlayers.length; i++)
        {
            AVotes.push(0);
        }
    }
    else
    {
        AvalonChannel.send("This is a dictator round. No voting will take place.");
        AState = AVALONSTATE.MISSION_PASS_FAIL;
        MissionBreif();
    }
}

function AvalonVote(vote, msg)
{
    if(!(msg.channel instanceof DISCORD.DMChannel))
    {
        msg.reply("you can only vote in DMs.");
        return;
    }

    if(AState != AVALONSTATE.MISSION_VOTE)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    for(var i = 0; i < APlayers.length;i++)
    {
        if(APlayers[i][1].id == msg.author.id)
        {
            if(vote == "approve")
            {
                AVotes[i] = 1;
            }
            else if(vote == "reject")
            {
                AVotes[i] = -1;
            }
            msg.reply("Vote registered.");
            AvalonChannel.send(APlayers[i][1].displayName + " has voted.");
        }
    }

    //resolve vote
    var VoteTotal = 0;
    for(var i = 0; i < AVotes.length;i++)
    {
        VoteTotal += AVotes[i];
        if(AVotes[i] == 0)//someone has not voted.
        {
            return;
        }
    }

    var MissionResults = "\n---------------\n";
    for(var i = 0; i < APlayers.length;i++)
    {
        var VoteToken = "";
        if(AVotes[i] == 1)
        {
            VoteToken = "approve :ok:";
        }
        else
        {
            VoteToken = "reject :no_entry_sign:";
        }
        MissionResults = MissionResults  + APlayers[i][1].displayName + " voted " + VoteToken + "\n";
    }

    
    if(VoteTotal > 0)//Mission Approved
    {
        AvalonChannel.send(MissionResults + "The mission was __***approved***__ :ballot_box_with_check:.\n---------------\n");
        AState = AVALONSTATE.MISSION_PASS_FAIL;
        MissionBreif();

    }
    else//Mission Rejected
    {
        AvalonChannel.send(MissionResults + "The mission was __***rejected***__ :x:.\n---------------\n");
        AState = AVALONSTATE.KING;
        AKingStage++;
        BreifKing();
    }
}

function MissionBreif()
{
    PreviousMissions.push(AMissionPeople);//add this mission to the log
    PrevKings.push(APlayers[mod(AKingIndex - 1, APlayers.length)][1].displayName);
    AvalonChannel.send("The adventurers set out on their valiant quest...\nThose who are on the mission, please vote !success or !fail in __***direct messages***__.");
    AVotes = [] //Init votes
    for(var i = 0; i < APlayers.length; i++)
    {
        AVotes.push(0);
    }
}

function AvalonMissionVote(vote, msg)
{
    if(!(msg.channel instanceof DISCORD.DMChannel))
    {
        msg.reply("you can only vote in DMs.");
        return;
    }

    if(AState != AVALONSTATE.MISSION_PASS_FAIL)
    {
        msg.reply("There's a time and place for everything. But not now!");
        return;
    }

    var StartHealth = 1;
    if(APlayers.length >= 7 && AMissionIdx === 3)
    {
        StartHealth = 2;//1 more fail needed
    }

    for(var i = 0; i < APlayers.length;i++)
    {
        if(APlayers[i][1].id == msg.author.id)
        {
            if(AMissionPeople.includes(i))
            {
                if(vote == "fail")
                {
                    if(APlayers[i][3] == true)
                    {
                        AVotes[i] = -1;
                    }
                    else
                    {
                        msg.reply("You can't fail this mission! You are good. This will count as a success.");
                        vote = "success";
                        AVotes[i] = 1;
                    }
                }
                else if(vote == "success")
                {
                    AVotes[i] = 1;
                }

                msg.reply("Vote registered as " + vote);
                AvalonChannel.send(APlayers[i][1].displayName + " has completed their part of the quest.");
            }
            else
            {
                msg.reply("You aren't on the mission! Stop trying to cheat.");
                return;
            }

        }
    }

    var MissionHealth = StartHealth;
    //resolve vote?
    for(var i = 0; i < AVotes.length;i++)
    {
        if(AMissionPeople.includes(i))
        {
            if(AVotes[i] == 0)
            {
                return;//don't resolve yet
            }
            if(AVotes[i] == -1)
            {
                MissionHealth += AVotes[i];
            }
        }
    }

    var MissionResults = "\n---------------\n";
    
    if(MissionHealth > 0)//Mission Success
    {
        AvalonChannel.send(MissionResults + ":confetti_ball:The mission passed.:confetti_ball:\nNumber of fails:"+ (StartHealth - MissionHealth).toString() + "\n---------------\n");
        if(AvalonSFXConnection)
        {
            PlaySFX("./mission_win.mp3");
        }
        AMissions[AMissionIdx] = true;
    }
    else//Mission Rejected
    {
        AvalonChannel.send(MissionResults + ":x:The mission failed :x:.\nNumber of fails:"+ (StartHealth - MissionHealth).toString() + "\n---------------\n");
        if(AvalonSFXConnection)
        {
            PlaySFX("./mission_fail.mp3");
        }
        AMissions[AMissionIdx] = false;
    }

    AMissionIdx++;
    var Wins = [0,0];
    for(var i = 0; i < AMissionIdx; i++)
    {
        if(AMissions[i])
        {
            Wins[0]++;
        }
        else
        {
            Wins[1]++;
        }
    }

    if(Wins[0] >= 3 || Wins[1] >=3)
    {
        DisplayBoard();
        AState = AVALONSTATE.ASSASSINATE;
        AssassinBreif();
        return;
    }


    if(AMissionIdx == 1)//don't lady
    {
        AState = AVALONSTATE.KING;
        AKingStage = 1;
        BreifKing();
    }
    else if(AMissionIdx == 5)
    {
        DisplayBoard();
        AState = AVALONSTATE.ASSASSINATE;
        AssassinBreif();
    }
    else
    {//Do lady of the lake.
        DisplayBoard();
        AState = AVALONSTATE.LADY;
        if(IsLancelot) LancelotDraw();
        BreifLady();
    }
}

function LancelotDraw()
{
    var Card = LancelotDeck.pop();
    var LancelotMessage = "You draw a card from the \"swap deck\":";
    if(Card)
    {
        LancelotMessage = LancelotMessage + ":arrows_counterclockwise:\n*Lancelots switch allegiance.*";//
        var NewPlayers = APlayers;
        for(var i = 0; i < APlayers.length; i++)
        {
            if(APlayers[i][2] == AVALONROLES.BLANCELOT)
            {
                NewPlayers[i][2] = AVALONROLES.GLANCELOT;
                NewPlayers[i][3] = false;
                NewPlayers[i][1].send("You have switched allegiance\nYou are now the good Lancelot:superhero:.");
            }
            else if(APlayers[i][2] == AVALONROLES.GLANCELOT)
            {
                NewPlayers[i][2] = AVALONROLES.BLANCELOT;
                NewPlayers[i][3] = true;
                NewPlayers[i][1].send("You have switched allegiance\nYou are now the evil Lancelot:supervillain:.");
            }
        }
    }
    else
    {
        LancelotMessage = LancelotMessage + ":stop_button:\n*Lancelots do not switch allegiance.*"
    }
    AvalonChannel.send(LancelotMessage);
}

function BreifLady()
{
    AvalonChannel.send(":dancer:" + APlayers[ALadyIndex][1].displayName + " is the lady of the lake.\nType !lady @username to find someone's affiliation.");
}

function LadyAvalon(msg)
{
    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }
    if(AState != AVALONSTATE.LADY)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    if(msg.author.id !== APlayers[ALadyIndex][1].id)
    {
        msg.reply("only the lady may check someone's affiliation.");
        return;
    }

    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");

    var foundPerson = false;
    var NewLady = 0;

    var LookingFor = args[1].replace(/[\\<>@#&!]/g, "");
    for(var j = 0; j < APlayers.length; j++)//search for each person.
    {
        if(APlayers[j][1].id == LookingFor)
        {
            foundPerson = true;
            NewLady = j;
            continue;
        }
    }

    if(!foundPerson)
    {
        AvalonChannel.send("Could not find " + args[i] + "\nPlease try again.");
        return;
    }

    if(PreviousLadies.includes(NewLady))
    {
        msg.reply("you can't lady someone who was previously the lady.");
        return;
    }

    PreviousLadies.push(NewLady);
    var LadyMessage =  "The lady of the lake says that " + APlayers[NewLady][1].displayName;

    if(APlayers[NewLady][3])
    {
        LadyMessage = LadyMessage + " is evil.:japanese_goblin:";
    }
    else
    {
        LadyMessage = LadyMessage + " is good.:innocent:"
    }

    APlayers[ALadyIndex][1].send(LadyMessage);
    ALadyIndex = NewLady;
    AvalonChannel.send(APlayers[ALadyIndex][1].displayName + " is the new lady.:dancer:");

    AState = AVALONSTATE.KING;
    AKingStage = 1;
    BreifKing();
}

function AssassinBreif()
{
    var Breif = "--------------------------------\nThe game is over\n--------------------------------\n";
    if(!DidWin(AMissions))
    {
        Breif = Breif + ":japanese_goblin:The evil team won the game:japanese_goblin:.\nBut the bad team must guess who is Merlin for fun.\n";
    }

    Breif = Breif + "The evil team reveals themselves.\n";

    for(var i = 0; i < APlayers.length;i++)
    {
        if(APlayers[i][3] && APlayers[i][2] != AVALONROLES.OBERON)
        {
            Breif = Breif + APlayers[i][1].displayName + " is " + APlayers[i][2] + "\n";
        }
    }

    Breif = Breif + "<@" + APlayers[AAssassinIndex][0] + "> is acting as the assassin.:crossed_swords:\nPlease choose someone using !assassinate @username.";
    AvalonChannel.send(Breif);
}

function AssassinateAvalon(msg)
{
    if(msg.channel !== AvalonChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }
    if(AState != AVALONSTATE.ASSASSINATE)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    if(msg.author.id !== APlayers[AAssassinIndex][1].id)
    {
        msg.reply("only the assassin may assassinate.");
        return;
    }

    var noSpace = msg.content.replace(/\s+/g, " ");
    var args = noSpace.substring(config.prefix.length).split(" ");

    var foundPerson = false;
    var DeadPerson = 0;
    var LookingFor = args[1].replace(/[\\<>@#&!]/g, "");
    for(var j = 0; j < APlayers.length; j++)//search for each person.
    {
        if(APlayers[j][1].id == LookingFor)
        {
            foundPerson = true;
            DeadPerson = j;
            continue;
        }
    }

    if(!foundPerson)
    {
        AvalonChannel.send("Could not find " + args[1] + "\nPlease try again.");
        return;
    }

    var FinalMessage = "";
    var MerlinDead = false;
    if(APlayers[DeadPerson][2] == AVALONROLES.MERLIN)
    {
        MerlinDead = true;
        FinalMessage = ":skull_crossbones::x::man_mage:Merlin is dead!:man_mage::x::skull_crossbones:\n";
        if(AvalonSFXConnection)
        {
            PlaySFX("./merlin_kill.mp3");
        }
    }
    else if(APlayers[DeadPerson][2] == AVALONROLES.JEFFERY)
    {
        MerlinDead = true;
        FinalMessage = "Merlin sees that his younger brother Jeffery is about to get killed and jumps in the way.\n:skull_crossbones::x::man_mage:Merlin is dead!:man_mage::x::skull_crossbones:\n";
        if(AvalonSFXConnection)
        {
            PlaySFX("./merlin_kill.mp3");
        }
    }
    else
    {
        FinalMessage = "You killed " + APlayers[DeadPerson][2] + "\n";
        if(AvalonSFXConnection)
        {
            PlaySFX("./merlin_miss.mp3");
        }
    }

    if(MerlinDead || !DidWin(AMissions))
    {
        FinalMessage = FinalMessage + ":japanese_goblin::japanese_goblin::japanese_goblin:***EVIL TEAM WINS!***:japanese_goblin::japanese_goblin::japanese_goblin:\n";
        //Give evil team money
        if(AvalonSFXConnection)
        {
            PlaySFX("./evil_wins.mp3");
        }
        FinalMessage = FinalMessage + AMoneyReward(true);
    }
    else
    {
        FinalMessage = FinalMessage + ":confetti_ball::innocent::confetti_ball:***GOOD TEAM WINS!***:confetti_ball::innocent::confetti_ball:\n";

        if(AvalonSFXConnection)
        {
            PlaySFX("./good_wins.mp3");
        }

        FinalMessage = FinalMessage + AMoneyReward(false);
    }

    FinalMessage = FinalMessage + "The final roles were:\n"

    for(var i = 0; i < APlayers.length; i++)
    {
        FinalMessage = FinalMessage + APlayers[i][1].displayName + " was " + APlayers[i][2] + "\n";
    }

    AvalonChannel.send(FinalMessage);
    BotStatus = STATUS.READY;
}

function AMoneyReward(EvilWin)
{
    var BankMessage = "";
    for(var iPlayer = 0; iPlayer < APlayers.length; iPlayer++)
    {
        if(APlayers[iPlayer][3] == EvilWin)//if they are evil
        {
            for(var iAcc = 0; iAcc < BankAccounts.length; iAcc++)
            {
                if(APlayers[iPlayer][1].id == BankAccounts[iAcc][0])
                {
                    if(BankAccounts[iAcc][1] < 12)
                    {
                        BankAccounts[iAcc][1] = 12;
                        BankMessage = BankMessage + APlayers[iPlayer][1].displayName + " has been reimbursed and now has 12$ in their account.:dollar:\n";
                    }
                }
            }
        }
    }
    SaveAccounts();
    return BankMessage;
}

function DisplayBoard()
{
    var Board = "";
    for(var i = 0; i < 5; i++)
    {
        if(i < AMissionIdx)
        {
            if(AMissions[i] === false)
            {
                Board = Board + ":red_circle:";
            }
            else
            {
                Board = Board + ":blue_circle:";
            }
        }
        else
        {
            Board = Board + ":white_circle:";
        }
    }
    Board = Board + "\n";
    for(var i = 0; i < 5; i++)
    {
        Board = Board + DigitToEmoji(MissionPresets[APlayers.length][i]);
    }
    AvalonChannel.send(Board);
}

function PreviousAvalon(msg)
{

    if(([AVALONSTATE.JOIN,AVALONSTATE.GAME_READY, AVALONSTATE.GAME_END].includes(AState)))
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(PreviousMissions.length == 0)
    {
        msg.reply("There haven't been any previous missions.");
        return;
    }

    var MissionsEmbed = new DISCORD.MessageEmbed()
	.setColor('#EEFF32')
	.setTitle("Previous missions")
    .setAuthor("Avalon", "https://i.imgur.com/wGaN5z0.png")

    for(var i = 0; i < PreviousMissions.length;i++)
    {
        var MissionString = ""
        for(var j = 0; j < PreviousMissions[i].length;j++)
        {
            MissionString = MissionString + APlayers[PreviousMissions[i][j]][1].displayName;
            if(j != PreviousMissions[i].length-1)
            {
                MissionString = MissionString + ", ";
            }
        }
        MissionsEmbed.addField("Quest " + (i+1).toString() + " proposed by " + PrevKings[i] + ":",MissionString,true);
    }

    AvalonChannel.send(MissionsEmbed);
}

///
///The Mind
///

const MINDSTATE = 
{
    JOIN:'join',
    START:'start',
    PLAY:'play',
    NEXTLEVEL:'next level'
}

const LevelPreset = ["N","Shur", "Life", "N", "Shur", "Life", "N", "Shur", "Life"];

var MindChannel;

var MPlayers;

var MLives = 0;
var MShuriken = 0;
var MLevel;

var MVotes;
var MCheats;



function InitMind()
{
    MState = MINDSTATE.JOIN;
    MPlayers = [];
    MLives = 0;
    MShuriken = 0;
    MLevel = 1;
    MVotes = [];
    MCheats = 0;
}


function JoinMind(msg)
{
    if(msg.channel !== MindChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(MState == MINDSTATE.JOIN)
    {
        if(MPlayers.length >= 100)
        {
            msg.reply("no more space for players.")
        }
        if(!ArrSearch(MPlayers, msg.author.id))
        {
            MPlayers.push([msg.author.id, msg.member,[],'']);
            MindChannel.send(msg.member.displayName + " has joined the game.");
        }
        else
        {
            msg.reply("looks like you are already part of the game.");
        }
    }
    else
    {
        msg.reply("you can't join; the game is already in progress.")
    }
}

function WhoMind(msg)
{
    msg.channel.send("Players currently in the game:");
    var PlayerList = "";
    for (i = 0; i < MPlayers.length; i++) 
    {
        PlayerList =  PlayerList + " " + MPlayers[i][1].displayName + " |";
    }
    msg.channel.send(PlayerList);
}

function StartMind(msg)
{
    if(MState != MINDSTATE.JOIN)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    if(msg.channel !== MindChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(MPlayers.length <= 1)
    {
        msg.reply("not enough players to start the mind");
        return;
    }

    MLevel = 1;
    MShuriken = 1;
    MLives = Math.floor(Math.log2(3*(MPlayers.length - 1))) + 1;
    ResetMVotes();

    MState = MINDSTATE.NEXTLEVEL;
    DealHand();
}

function DealHand()
{
    var deck = [];

    for (var i = 1; i <= 100; i++) 
    {
        deck.push(i);
    }
    shuffle(deck);
    for(var i = 0; i < MPlayers.length;i++)
    {
        for(var j = 0; j < MLevel; j++)
        {
            MPlayers[i][2].push(deck.pop());
        }
        MPlayers[i][2].sort(function(a, b){return a-b});
        MPlayers[i][1].send(HandString(i)).then((newMessage) => {SaveMessage(newMessage)});;
    }

    //breif people.

    var Breif = "\n====================\nLevel " + MLevel + " will begin soon.\nYou have " + MLives + " HP:heart:\nYou have " + MShuriken + " shurikens left.:knife:\n*Check your cards then type !ready when you are ready.*";
    MindChannel.send(Breif);
    MState = MINDSTATE.START;
}

function SaveMessage(msg)
{
    for(var i = 0; i < MPlayers.length; i++)
    {
        if(msg.channel.recipient.id == MPlayers[i][1].id)
        {
            MPlayers[i][3] = msg;
        }
    }
}

function HandString(Pidx)
{
    return "The mind level "+ MLevel + "\n====================\nYour hand is:" + MPlayers[Pidx][2].toString()
}

function MindReady(msg)
{
    if(MState != MINDSTATE.START)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(msg.channel !== MindChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    var foundPerson = false;
    for(var i = 0; i < MPlayers.length;i++)
    {
        if(MPlayers[i][1].id == msg.author.id)
        {
            foundPerson = true;
            MVotes[i] = 1;
            MindChannel.send(msg.member.displayName + " is ready.");
        }
    }
    if(!foundPerson)
    {
        msg.reply("you aren't part of the game.")
    }

    for(var i = 0; i < MPlayers.length;i++)
    {
        if(MVotes[i] != 1)
        {
            return;
        }
    }

    ResetMVotes();
    //game must start
    MindChannel.send("The game has begun. Type !play to play a card. e.g. !play 56");
    MState = MINDSTATE.PLAY;
}

function MindPlay(msg)
{
    if(MState != MINDSTATE.PLAY)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }

    if(msg.channel !== MindChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    ResetMVotes();

    var noSpace = msg.content.replace(/\s+/g, " ");
    let args = noSpace.substring(config.prefix.length).split(" ");
    if(isNaN(args[1]))
    {
        msg.reply("that's not a number!");
        return;
    }

    var CardNo = Number(args[1]);

    var foundPerson = false;
    for(var i = 0; i < MPlayers.length;i++)
    {
        if(MPlayers[i][1].id == msg.author.id)
        {
            if(MPlayers[i][2].includes(CardNo))
            {
                PlayCard(CardNo, i);
                MindChannel.send(MPlayers[i][1].displayName + " played " + CardNo + ". They now have " + (MPlayers[i][2].length) + " cards remaining.");
            }
            else
            {
                if(MCheats < 4)
                {
                    msg.reply("you don't have that card. Stop forcing me to give away information:angry:. I now consider you less psychic.");
                }
                else if(MCheats < 6)
                {
                    msg.reply("you don't have that card!! Stop doing this!!!:rage::rage::rage:\n");
                }
                else if(MCheats < 8)
                {
                    msg.reply("YOU DONT HAVE THAT CARD! I AM VERY ANGRY RIGHT NOW.");
                }
                else
                {
                    CloseBot();
                }
                MCheats++;
            }
            foundPerson = true;
        }
    }
    if(!foundPerson)
    {
        msg.reply("you aren't part of the game.");
        return;
    }

    if(MLives <= 0)
    {
        MindChannel.send(":skull:The game is over.:skull:\nYou reached level " + MLevel);
        BotStatus = STATUS.READY;//end game
    }

    CheckRoundEnd();
}

function CheckRoundEnd()
{
    //check for round end
    for(var iPlayer = 0; iPlayer < MPlayers.length; iPlayer++)
    {
        if(MPlayers[iPlayer][2].length != 0)
        {
            return;
        }
    }

    MLevel++;
    //round has ended.
    EndRound();
}


function PlayCard(Card, Pidx)
{
    RemoveCardFromHand(Card, Pidx);
    MPlayers[Pidx][3].edit(HandString(Pidx));
    var LifeLost = false;
    for(var iPlayer = 0; iPlayer < MPlayers.length; iPlayer++)
    {
        for(var iCard = 0; iCard < MPlayers[iPlayer][2].length; iCard++)
        {
            if(MPlayers[iPlayer][2][iCard] < Card)
            {
                LifeLost = true;
                MindChannel.send(":x:" + MPlayers[iPlayer][1].displayName + " had a lower card:" + MPlayers[iPlayer][2][iCard] + ". They now have " + (MPlayers[iPlayer][2].length - 1) + " cards remaining.");
                MPlayers[iPlayer][2].splice(iCard, 1);
                MPlayers[iPlayer][3].edit(HandString(iPlayer));
                
                iCard--;
            }
        }
    }
    if(LifeLost)
    {
        MLives--;
        MindChannel.send("You now have " + MLives + " HP:heart:");
    }
}

function RemoveCardFromHand(Card, Pidx)
{
    var RemoveIndex = MPlayers[Pidx][2].indexOf(Card);
    if (RemoveIndex > -1) //remove the card from the player's hand
    {
        MPlayers[Pidx][2].splice(RemoveIndex, 1);
    }
    else
    {
        MindChannel.send("FATAL ERROR!:skull:");
        BotStatus = STATUS.READY;
    }
}

function EndRound()
{
    var EndMessage = "====================\nThe round is over.\n====================\n";
    if(MLevel < LevelPreset.length)
    {
        switch(LevelPreset[MLevel])
        {
            case "Life":
                EndMessage = EndMessage + "You gained a life:heart:\n";
                MLives++;
                break;
            case "Shur":
                MShuriken++;
                EndMessage = EndMessage + "You gained a shuriken:knife:\n";
                break;
        }
    }
    MState = MINDSTATE.NEXTLEVEL;
    MindChannel.send(EndMessage);
    DealHand();
}

function MindShuriken(msg)
{
    if(MState != MINDSTATE.PLAY)
    {
        msg.reply("there's a time and place for everything. But not now!");
        return;
    }
    
    if(msg.channel != MindChannel)
    {
        msg.reply("please say that in the channel where the game is being played.");
        return;
    }

    if(MShuriken <= 0)
    {
        msg.reply("no shurikens are left.");
        return;
    }

    var personIndex = -1;
    for(var i = 0; i < MPlayers.length;i++)
    {
        if(MPlayers[i][1].id == msg.author.id)
        {
            personIndex = i;
        }
    }

    if(personIndex == -1)
    {
        msg.reply("you aren't playing the game.");
    }

    MVotes[personIndex] = 1;
    var ShurMessage = MPlayers[personIndex][1].displayName + " voted to play a shuriken.\n";
    for(var i = 0; i < MVotes.length; i++)
    {
        if(MVotes[i] == 0)
        {
            MindChannel.send(ShurMessage);
            return;
        }
    }

    //shuriken is played
    ShurMessage = ShurMessage + "You have all agreed to play a Shuriken:knife:.\n";

    for(var i = 0; i < MPlayers.length;i++)
    {
        var SmallestCard = [0, 1000];
        for(var j = 0; j < MPlayers[i][2].length; j++)
        {
            if(MPlayers[i][2][j] < SmallestCard[1])
            {
                SmallestCard = [j, MPlayers[i][2][j]];
            }

        }
        if(SmallestCard[1] != 1000)
        {
            RemoveCardFromHand(SmallestCard[1], i);
            ShurMessage = ShurMessage + MPlayers[i][1].displayName + "'s lowest card was " + SmallestCard[1] + ".\n";
        }
    }

    MShuriken--;
    MindChannel.send(ShurMessage);
    ResetMVotes();

    CheckRoundEnd();
}

function ResetMVotes()
{
    MVotes = [];
    for(var i = 0; i < MPlayers.length; i++)
    {
        MVotes.push(0);
    }
}

///
///Slots
///
///                    0       1         2          3        4       5
const SlotSymbols = [":x:",":lemon:",":cherries:",":house:",":atm:",":100:"];

function PullSlot(msg)
{
    var PlayerIndex = -1;
    for(var i = 0; i < BankAccounts.length; i++)
    {
        if(msg.author.id == BankAccounts[i][0])
        {
            PlayerIndex = i;
            break;
        }
    }

    if(PlayerIndex == -1)
    {
        PlayerIndex = BankAccounts.length;
        BankAccounts.push([msg.member.id,10]);//create account
        msg.reply("you don't yet have a dipsoc bank account. A new one has been opened with 10$.");
    }

    if(BankAccounts[PlayerIndex][1] <= 1)
    {
        return;
    }

    BankAccounts[PlayerIndex][1]-= 2;//Pay 2 for the slot

    var SlotResults = [Math.floor(Math.random() * (SlotSymbols.length)),Math.floor(Math.random() * (SlotSymbols.length)),Math.floor(Math.random() * (SlotSymbols.length))];
    var SlotBreif = "You put 2$ in the slot machine...\n";

    for(var i = 0; i < SlotResults.length;i++)
    {
        SlotBreif = SlotBreif + SlotSymbols[SlotResults[i]];
    }

    var Gain = 0;

    if(SlotResults[0]*SlotResults[1]*SlotResults[2] == 0)//3 x
    {
        SlotBreif = SlotBreif + "\nToo bad. ";
        Gain = -3;
    }
    else if(SlotResults[0] === SlotResults[1] && SlotResults[1] === SlotResults[2])//all three are equal.
    {
        Gain = SlotResults[0]*4;
        if(SlotResults[0] == 5)
        {
            SlotBreif = SlotBreif + "\n:moneybag:You won the jackpot.:moneybag:"
        }
    }
    else//sum
    {
        Gain = Math.max(...SlotResults) - 1;
    }

    BankAccounts[PlayerIndex][1] += Gain;

    SlotBreif = SlotBreif + "\nYou won " + Gain + "$. You now have " + BankAccounts[PlayerIndex][1] +"$.\n";

    if(BankAccounts[PlayerIndex][1] <= 1)
    {
        SlotBreif = SlotBreif + "\n:skull:You can't play slots until you get more money.:skull:\n"
    }

    WriteHS(PlayerIndex, msg.member.displayName);

    if(Gain > 5)
    {
        ClearDebts(msg);
        SlotBreif = SlotBreif + ":game_die::black_joker::dollar: To celebrate this big win, all accounts have been bumped up to 10$.";
    }

    SaveAccounts();
    msg.channel.send(SlotBreif);
}

function WriteHS(PlayerIndex, name)
{
    var HS = GetSlotHS();
    if(BankAccounts[PlayerIndex][1] > HS[1])
    {
        HS[0] = name;
        HS[1] = BankAccounts[PlayerIndex][1];
    }
    
    try 
    {
        const data = fs.writeFileSync('./SlotHS.txt', HS[0] + " " + HS[1]);
        //file written successfully
    } 
    catch (err)
    {
        console.error(err);
        CloseBot();
    }
}

function GetSlotHS()
{
    try 
    {
        const data = fs.readFileSync('./SlotHS.txt', 'utf8');
        var HSData = data.split(" ");
        HSData[1] = Number(HSData[1]);
    } 
    catch (err) 
    {
        console.error(err);
        CloseBot();
    }
    return HSData;
}

function ClearDebts(msg)
{
    for(var i = 0; i < BankAccounts.length;i++)
    {
        if(BankAccounts[i][1] < 10)
        {
            BankAccounts[i][1] = 10;
        }
    }
    msg.channel.send(":game_die::black_joker::dollar: All slot machine debts have been cleared.");
}

///
///Utils
///

function CloseBot()
{
    BOT.destroy();
}

function DidWin(arr)
{
    var Total = 0;
    for(var i = 0; i < arr.length; i++)
    {
        if(arr[i])
        {
            Total++;
        }
        else
        {
            Total--;
        }
    }
    if(Total > 0) return true;
    return false;
}

function ArrSearch(arr, search) 
{
    return arr.some(row => row.includes(search));
}

function shuffle(a) 
{
    for (let i = a.length - 1; i > 0; i--) 
    {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function mod(a,b)
{
    var Retrunval = a % b;
    if(Retrunval < 0)
    {
        Retrunval += b;
    }
    return Retrunval;
}

function DigitToEmoji(d)
{
    switch(d)
    {
        case 1:
            return "1️⃣";
        case 2:
            return "2️⃣";
        case 3:
            return "3️⃣";
        case 4:
            return "4️⃣";
        case 5:
            return "5️⃣";
        case 6:
            return "6️⃣"; 
        case 7:
            return "7️⃣";
        case 8:
            return "8️⃣";
        case 9:
            return "9️⃣";
        case 0:
            return "0️⃣";            
    }
}

function GetNthDigit(num,idx)
{
    return Number(num.toString()[idx]);
}

function hasDuplicates(array) 
{
    return (new Set(array)).size !== array.length;
}

function LetterToEmoji(Letter)
{
    if(Letter == "*") return ":eight_spoked_asterisk:";
    return ":regional_indicator_" + Letter + ":";
}

function RandEle(arr)
{
    var Index = Math.floor(Math.random()*arr.length);
    return arr[Index];
}

function ArrayEquals(a,b)
{

    if(a.length != b.length) 
    {
       return false; 
    }
    else
    { 
        // comapring each element of array 
        for(var i=0;i<a.length;i++) if(a[i]!=b[i]) return false; 
        return true; 
   } 
}

String.prototype.replaceAt=function(index, replacement)
{
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

function OneInN(n)
{
    if(Math.floor(Math.random()*n) == 0)
        return true;
    else
        return false;
}

function RemoveElement(arr,ele)
{
    var Index = arr.indexOf(ele);
    arr.splice(Index,1);
}

function ReplaceElement(arr,ele,replacement)
{
    for(var i = 0; i < arr.length;i++)
    {
        if(arr[i] == ele) arr[i] = replacement;
    }
}

function SwapElements(arr,i,j)
{
    if(i==j) return;
    var t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}

function GetMsgSenderIdx(PersonID, PlayerList)
{
    for(var i = 0; i < PlayerList.length; i++)
    {
        if(PlayerList[i][1].id == PersonID) return i;
    }
    return -1;
}

function WhoGame(Players, msg)
{
    var PlayerList = "Players currently in the game:\n";
    for (i = 0; i < Players.length; i++) 
    {
        PlayerList =  PlayerList + Players[i][1].displayName + " | ";
    }
    msg.channel.send(PlayerList + "\nTotal Players:" + Players.length);
}

async function DeleteMessage(msg, thereason)
{
    var BotMessage = await msg.reply(thereason);
    await msg.delete({timeout: 1000, reason: thereason});
    BotMessage.delete({timeout: 0, reason: ""});
}

const DISCORDMAXCHAR = 2000;

function FragmentMessage(contents,MaxBucketSize)
{
    var Buckets = [""];
    var Lines = contents.split(/\r?\n/);
    for(var i = 0; i < Lines.length;i++)
    {
        if(Lines[i].length > MaxBucketSize)
            return ["ERROR: LINE TO LONG."];
        var CurrentBucketLen = G_splitter.splitGraphemes(Buckets[Buckets.length - 1]).length;
        var NewLineLen = G_splitter.splitGraphemes(Lines[i]).length;
        if(CurrentBucketLen + NewLineLen <= MaxBucketSize)//if new line will fit
        {
            Buckets[Buckets.length - 1] = Buckets[Buckets.length - 1].concat("\n" + Lines[i]); //add to current bucket         
        }
        else
        {
            Buckets.push(Lines[i]);//start new bucket
        }
    }
    return Buckets;
}

async function SendFragmented(channel, message, MaxBucketSize)
{
    Buckets = FragmentMessage(message, MaxBucketSize);
    for(var i = 0; i < Buckets.length; i++)
    {
        await channel.send(Buckets[i]);
    }
}

