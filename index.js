const DISCORD = require('discord.js');
const config =  require('./config.json');
const fs = require('fs'); 
const Wordnik_API = require('./wordnik.js'); 
const BOT = new DISCORD.Client;



const STATUS = {
    MIND : 'The Mind',
    AVALON: 'Avalon',
    READY: 'ready'
}

var BotStatus = STATUS.READY;
var BotChannel;
var BankAccounts = [];

BOT.on("ready", () =>{
    LoadAccounts();
    console.log("Bot is online.");
})

BOT.on("message", msg =>{
    if(msg.author.bot) return;//ignore any bots(including this one)
    if(msg.content.indexOf(config.prefix) !== 0) return;

    var noSpace = msg.content.replace(/\s+/g, " ");
    let args = noSpace.substring(config.prefix.length).split(" ");

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
        case "here":
            BotChannel = msg.channel;
            BotChannel.send("Default bot channel is #" + BotChannel.name);
            break;
        case "account":
            ShowBalance(msg);
            break;
        case "word":
            WordCommand(msg);
            break;
        case "ding":
            msg.reply("URCH");
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

    if(BotStatus == STATUS.AVALON)
    {
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
                WhoAvalon(msg);
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
    }
    else if(BotStatus === STATUS.MIND)
    {
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
                WhoMind(msg);
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
    const WordEmbed = new DISCORD.MessageEmbed()
        .setColor('#808065')
	    .setTitle(word.word)
	    .setAuthor('Dipsoc bot teaches words', 'https://i.imgur.com/1Ng6L1l.png')
        .setDescription("*" + definition.partOfSpeech + ".* " + definition.text);
    
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
            msg.reply("looks like you already part of the game.");
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
    console.log(APlayers.toString());
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
            msg.reply("looks like you already part of the game.");
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
        console.log("High score:" + HS.toString());
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
            return ":one:";
        case 2:
            return ":two:";
        case 3:
            return ":three:";
        case 4:
            return ":four:";
        case 5:
            return ":five:";
        case 6:
            return ":six:"; 
        case 7:
            return ":seven:";
        case 8:
            return ":eight:";
        case 9:
            return ":nine:";
        case 0:
            return ":zero:";            
    }
}

function hasDuplicates(array) 
{
    return (new Set(array)).size !== array.length;
}