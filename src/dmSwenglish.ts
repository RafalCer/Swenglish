import { MachineConfig, send, Action, assign, actions } from "xstate";
import {game_vocab} from "./definitions_and_words"
import {gameGrammar, animalsGrammar, weekdaysGrammar, occupationsGrammar, familyGrammar, verbsGrammar, coloursGrammar, geographicalGrammar} from "./grammars/vocabGrammar"

const promptReset: Action<SDSContext, SDSEvent> = assign((context) => { return { count:0} })
const scoreReset: Action<SDSContext, SDSEvent> = assign((context) => { return { score:0} })

export function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}
 
export function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const {cancel} = actions

function invoke_rasa(go_to_state: string,): MachineConfig<SDSContext, any, SDSEvent> {
    return ({ 
            invoke: {
                id: 'rasaApi',
                src: (context, event) =>  nluRequest(context.task),
                onDone:{
                    target: go_to_state,
                    actions:[
                        assign((context, event) => { return { intentResult: event.data.intent.name} }),
                        (context:SDSContext, event:any) => console.log(event.data)]
                },
                onError:{
                    target: '#welcome',
                    actions: (context, event) => console.log(event.data)
}}})}

function sayAskTimeout(say_this: Action<SDSContext, SDSEvent>): MachineConfig<SDSContext, any, SDSEvent> {
    return ({ 
        initial: 'prompt',
        states: {
            prompt: {
                entry: [promptReset, say_this],
                on: { ENDSPEECH: 'ask'}},
            ask: {
                entry: [send('LISTEN'), /*send ('TIMEOUT', {delay: 30000, id: 'timer'})*/]
            },
            nomatch: {
                entry: say('Sorry, please repeat.'),
                on: {ENDSPEECH: "ask"}
            },
            timeout_final: {
                entry: say('Returning to idle.'),
                on: {ENDSPEECH: "idle"}
            },
            idle:{
                id: 'idle',
                type: 'final'
            },
            timeout: {
                initial: 'prompt',
                on: {TIMEOUT: [{cond: (context) => context.count ===1, target: 'reprompt0'},
                                {cond: (context) => context.count ===2, target: 'reprompt1'},
                                {cond: (context) => context.count ===3, target: 'reprompt2'},
                                {cond: (context) => context.count ===4, target: 'timeout_final'}]},
                states:{
                    prompt: {
                        entry: send('TIMEOUT')
                    }
                }
            },
            reprompt0: {
                entry: say(" Doesn't look like I can hear you well. Please try again"),
                on: {ENDSPEECH: 'ask'}
            },
            reprompt1: {
                entry: say('Sorry, still nothing.'),
                on: {ENDSPEECH: 'ask'}
            },
            reprompt2: {
                entry: say(':et us give it one last try'),
                on: {ENDSPEECH: 'ask'}
}}})}


function Say_play(say_word: Action<SDSContext, SDSEvent>): MachineConfig<SDSContext, any, SDSEvent> {
    return ({ 
        initial: 'prompt',
        states: {
            prompt: {
                entry: [promptReset, say_word],
                on: {ENDSPEECH: 'ask'}},
            ask: {
                entry: [send('LISTEN'), send ('TIMEOUT', {delay: 30000, id:'timer2'})]
            },
            nomatch: {
                entry: say("I'm afraid not! Try again!"),
                on: {ENDSPEECH: "ask"}
            },
            idle:{
                type: 'final'
            },
            timeout: {
                initial: 'prompt',
                on: {TIMEOUT: [{target: 'reprompt'}]},
                states:{
                    prompt: {
                        entry: send('TIMEOUT')
                    }
                }
            },
            almost:{
                entry: say("Right! But what is the correct article?"),
                on:{ENDSPEECH: 'ask'}
            },
            match: {
                entry: say('Correct!'),
                on: {ENDSPEECH:'go_to_next'}
            },
            reprompt:{
                entry: say('Time is running out!')

            },
            go_to_next:{
                entry: send('NEXT_STATE')
            },
            skip_to_next:{
                entry: send('SKIP_STATE')
            },
}})}

function Show_play(): MachineConfig<SDSContext, any, SDSEvent> {
    return ({ 
        initial: 'prompt',
        states: {
            prompt: {
                entry: send('SHOW')},
            show:{
                entry: say(' '),
                on:{
                    ENDSPEECH: 'ask'
                }
            },
            ask: { entry: listen()
            },
            nomatch: {
                entry: say("I'm afraid not! Try again!"),
                on: {ENDSPEECH: "ask"}
            },
            idle:{
                type: 'final'
            },
            reprompt: {
                entry: [say("Time is up three!")],
                on: {ENDSPEECH: 'go_to_next'}
            },
            almost:{
                entry: say("Right! But what is the correct article?"),
                on:{ENDSPEECH: 'ask'}
            },
            match: {
                entry: say('Correct!'),
                on: {ENDSPEECH:'go_to_next'}
            },
            go_to_next:{
                entry: send('NEXT_STATE')
            },
            skip_to_next:{
                entry: send('SKIP_STATE')
            },
}})}

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://swenglish.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://maraev.me' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json()); 

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'start_point',
    states: {
        start_point:{
            id: 'starting_poing',
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            id: 'welcome',
            initial: 'prompt',
            on: {ENDSPEECH:'which_game'},
            states:{
                prompt:{
                    entry: [scoreReset, say('Welcome to Sweenglish!')]}
            }
        },
        which_game:{
            initial: 'prompt',
            id: 'which_game',
            on: {
                RECOGNISED:[{
                    actions: assign((context) => { return { task: context.recResult } }),
                    target: 'choice'}]},
            
            states:{
                prompt: {
                    entry: say('Which game would you like to play?'),
                    on: {ENDSPEECH: 'ask'}
                },
                ask:{ entry: listen()
                }
            }},

        choice:{
            initial: 'prompt',
            states:{
                prompt: { ...invoke_rasa('#tool')}
            }
        },
        tool:{
            initial: 'prompt',
            id: 'tool',
            on:{
                ENDSPEECH:[{
                    cond: (context) => context.intentResult === 'Definitions',
                    target: '#definitions'},
                    {cond: (context) => context.intentResult === 'Words',
                    target: '#wordplay'},
                    {cond: (context) => context.intentResult === 'Pictures',
                    target: '#pictures'},
                    {cond: (context) => context.intentResult === 'Quit',
                    target: '#exit_app'},
                    {cond: (context) => context.intentResult === 'Help',
                    target: '#general_help'},
                    {cond: (context) => context.intentResult === 'Animals' || context.intentResult === 'Weekdays' || context.intentResult === 'Family' || context.intentResult === 'Occupation' 
                    || context.intentResult === 'Colours' || context.intentResult === 'Verbs' || context.intentResult === 'Family' || context.intentResult === 'Geographical',
                    target: '.pick_game'},
                {target:'.nomatch'}]
            },
            states: {
                prompt: {
                    entry: send('ENDSPEECH')},
                nomatch: {
                    entry: say("Sadly such game is not yet implemented. Let us try again."),
                    on: {ENDSPEECH: '#which_game'}
                    },
                pick_game:{
                    entry: say("Great choice, but you have to choose a game mode first. Please try again"),
                    on: {ENDSPEECH: '#which_game'}}}
        },
        general_help:{
            initial: 'prompt',
            id: 'general_help',
            on: {ENDSPEECH: '#which_game'},
            states: {
                prompt: {entry: say(' Swenglish has three games: wordplay, definitions, and pictures. In Wordplay, you will be given a word in English and will have to come up,\
                 with its correspondence in Swedish. In definitions, you will be given definitions and will have to say the corresponding word in Swedish. In pictures, you will\
                be shown a picture and will have to name what you see in Swedish.')}
        }},
        wordplay: {
            initial: 'prompt',
            id: 'wordplay',
            on: {
                RECOGNISED:[{
                    actions: [assign((context) => { return { task: context.recResult} }), cancel('timer'), cancel('timer2')],
                    target: '#wordplay_invocation'}],
                    TIMEOUT: '.timeout'
            },
                    ...sayAskTimeout(say("Wordplay! Pick a category and let's start."))

        },
            wordplay_invocation:{
                initial: 'prompt',
                id: 'wordplay_invocation',
                states:{
                    prompt: { ...invoke_rasa('#wordplay_choice')}
                }
            },
            wordplay_choice:{
                initial: 'prompt',
                id: 'wordplay_choice',
                on:{
                    ENDSPEECH:[{
                        cond: (context) => context.intentResult === 'Help',
                        target: 'wordplay_help'},
                        {cond: (context) => context.intentResult === 'Quit',
                        target: '#quit_game'},
                        {cond: (context) => context.intentResult === 'Definitions',
                        target: '#definitions'},
                        {cond: (context) => context.intentResult === 'Wordplay',
                        target: 'wordplay_again'},
                        {cond: (context) => context.intentResult === 'Pictures',
                        target: '#pictures'},
                        {cond: (context) => context.intentResult === 'Animals',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Weekdays',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Occupation',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Colours',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Verbs',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Family',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
                        {cond: (context) => context.intentResult === 'Geographical',
                        actions: assign((context) => { return { game_category: context.recResult} }),
                        target: 'wordplay_pregame'},
  
                    {target:'.nomatch'}]
                },
                states: {
                    prompt: {
                        entry: send('ENDSPEECH')},
                    nomatch: {
                        entry: say("Unavailable right now."),
                        on: {ENDSPEECH: '#welcome'}
                            
                        }
                            
                    }
    
            },
            wordplay_again:{
                id: 'wordplay_again',
                on:{ENDSPEECH:[{
                    actions: assign((context) => { return { task: context.recResult } }),
                    target: '#wordplay_invocation'}],
                    TIMEOUT: '.timeout' },
                ...sayAskTimeout(say('You are already in the Wordplay mode! Pick a category to start playing.'))

            },
            wordplay_help:{
                initial: 'prompt',
                id: 'wordplay_help',
                on: {
                    RECOGNISED:[{
                        actions: assign((context) => { return { task: context.recResult } }),
                        target: 'wordplay_invocation'},
                    
                    {target: ".nomatch"}]
                },
                        ...sayAskTimeout(say("Wordplay is a game where you will be given a word in English and will have to say its correspondence in Swedish. You can choose from seven categories:\
                        Animals, Weekdays, Occupations, Colours, Verbs, Family, and Nature Objects. Each category consists of seven words. Note that only answers in Swedish will be accepted.\
                        Where applicable, be mindful of articles! You can quit the game by saying quit at any point in the game. You may now pick a category or change the game."))
            },
            wordplay_quit:{
                initial: 'prompt',
                id: 'wordplay_quit',
                on: {ENDSPEECH: '#which_game'},
               ...sayAskTimeout(say("Quitting Wordplay."))
            },
            wordplay_pregame:{
                initial: 'prompt',
                on: {
                    RECOGNISED: [{
                        cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Animals",
                        target: "#wordplay_animals_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Weekdays",
                        target: "#wordplay_weekdays_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Occupation",
                        target: "#wordplay_occupations_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Colours",
                        target: "#wordplay_colours_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Verbs",
                        target: "#wordplay_verbs_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Family",
                        target: "#wordplay_family_begin"},
                        {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Grographical",
                        target: "#wordplay_geographical_begin"},
                        {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                        target: "#quit_game"},
                    { target: ".nomatch" }],
                    ENDSPEECH: '.ask'
                },
                states: {
                    prompt:
                    {entry: send((context) => ({
                    type: "SPEAK",
                    value: `You have chosen ${context.game_category}. Say start - if you wish to begin; or quit - if you wish to change the game or the mode.`}))},
                    nomatch:{
                        entry: say('Sorry, I did not quite catch that. Please repeat'),
                        on: {ENDSPEECH: 'ask'},
                    },
                    ask: {
                        entry: listen()
                    }}},


/* ===================================================== WORDPLAY ANIMALS ===================================================================================================*/
            wordplay_animals_begin:{
                initial: 'prompt',
                id: 'wordplay_animals_begin',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_cat" in (animalsGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                    {cond: (context) => "cat" in (animalsGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                     actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],

                        NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_dog'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_dog'},
                        TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
            },
            ...Say_play(say(game_vocab.animals.cat.english))
        },
        wordplay_dog:{
            initial: 'prompt',
            id: 'wordplay_dog',
            on: {   RECOGNISED:[
                {cond: (context) => "en_dog" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "dog" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: [cancel('timer2'), cancel('timer')], target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_fox'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_fox'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.dog.english))
        },
        wordplay_fox:{
            initial: 'prompt',
            id: 'wordplay_fox',
            on: {   RECOGNISED:[
                {cond: (context) => "en_fox" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "fox" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sheep'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sheep'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.fox.english))
            },    
        wordplay_sheep:{
            initial: 'prompt',
            id: 'wordplay_sheep',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_sheep" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sheep" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target:  '#wordplay_giraffe'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_giraffe'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.sheep.english))
        },          
        wordplay_giraffe:{
            initial: 'prompt',
            id: 'wordplay_giraffe',
            on: {   RECOGNISED:[
                {cond: (context) => "en_giraffe" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "giraffe" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: cancel('timer2'),  target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_crocodile'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_crocodile'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.giraffe.english))
        },   
        wordplay_crocodile:{
            initial: 'prompt',
            id: 'wordplay_crocodile',
            on: {   RECOGNISED:[
                {cond: (context) => "en_crocodile" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "crocodile" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_peacock'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_peacock'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.crocodile.english))
        },      
        wordplay_peacock:{
            initial: 'prompt',
            id: 'wordplay_peacock',
            on: {   RECOGNISED:[
                {cond: (context) => "en_peacock" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "peacock" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.peacock.english))
        },
/* ==================================================================== WORDPLAY WEEKDAYS =================================================================================*/
        wordplay_weekdays_begin:{
            initial: 'prompt',
            id: 'wordplay_weekdays_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "Monday" in (weekdaysGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_tuesday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_tuesday'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Monday.english))},
        
        wordplay_tuesday:{
            initial: 'prompt',
            id: 'wordplay_tuesday',
            on: {   RECOGNISED:[
                {cond: (context) => "Tuesday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_wednesday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_wednesday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Tuesday.english))
        },

        wordplay_wednesday:{
            initial: 'prompt',
            id: 'wordplay_wednesday',
            on: {   RECOGNISED:[
                {cond: (context) => "Wednesday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_thursday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_thursday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Wednesday.english))
        },

        wordplay_thursday:{
            initial: 'prompt',
            id: 'wordplay_thursday',
            on: {   RECOGNISED:[
                {cond: (context) => "Thursday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_friday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_friday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Thursday.english))
        },

        wordplay_friday:{
            initial: 'prompt',
            id: 'wordplay_friday',
            on: {   RECOGNISED:[
                {cond: (context) => "Friday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_saturday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_saturday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Friday.english))
        },

        wordplay_saturday:{
            initial: 'prompt',
            id: 'wordplay_saturday',
            on: {   RECOGNISED:[
                {cond: (context) => "Saturday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sunday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sunday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Saturday.english))
        },

        wordplay_sunday:{
            initial: 'prompt',
            id: 'wordplay_sunday',
            on: {   RECOGNISED:[
                {cond: (context) => "Sunday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Sunday.english))
        },

/* ==================================================================== WORDPLAY OCCUPATIONS =================================================================================*/
        wordplay_occupations_begin:{
            initial: 'prompt',
            id: 'wordplay_occupations_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_doctor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_doctor'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.teacher.english))},

        wordplay_doctor:{
            initial: 'prompt',
            id: 'wordplay_doctor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_builder'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_builder'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.doctor.english))},

        wordplay_builder:{
            initial: 'prompt',
            id: 'wordplay_builder',
            on: {   RECOGNISED:[
                {cond: (context) => "en_builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_lifeguard'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_lifeguard'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.builder.english))},

        wordplay_lifeguard:{
            initial: 'prompt',
            id: 'wordplay_lifeguard',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_actor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_actor'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.lifeguard.english))},

        wordplay_actor:{
            initial: 'prompt',
            id: 'wordplay_actor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_engineer'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_engineer'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.actor.english))},

        wordplay_engineer:{
            initial: 'prompt',
            id: 'wordplay_engineer',
            on: {   RECOGNISED:[
                {cond: (context) => "en_engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_garbage_man'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_garbage_man'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.engineer.english))},

        wordplay_garbage_man:{
            initial: 'prompt',
            id: 'wordplay_garbage_man',
            on: {   RECOGNISED:[
                {cond: (context) => "en_garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.garbage_man.english))},

/* ==================================================================== WORDPLAY COLOURS =================================================================================*/
        wordplay_colours_begin:{
            initial: 'prompt',
            id: 'wordplay_colours_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "yellow" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_red'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_red'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.yellow.english))},

        wordplay_red:{
            initial: 'prompt',
            id: 'wordplay_red',
            on: {   RECOGNISED:[
                {cond: (context) => "red" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_purple'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_purple'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.red.english))},

        wordplay_purple:{
            initial: 'prompt',
            id: 'wordplay_purple',
            on: {   RECOGNISED:[
                {cond: (context) => "purple" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_brown'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_brown'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.purple.english))},

        wordplay_brown:{
            initial: 'prompt',
            id: 'wordplay_brown',
            on: {   RECOGNISED:[
                {cond: (context) => "brown" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_black'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_black'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.brown.english))},

        wordplay_black:{
            initial: 'prompt',
            id: 'wordplay_black',
            on: {   RECOGNISED:[
                {cond: (context) => "black" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_white'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_white'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.black.english))},

        wordplay_white:{
            initial: 'prompt',
            id: 'wordplay_white',
            on: {   RECOGNISED:[
                {cond: (context) => "white" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_green'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_green'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.white.english))},

        wordplay_green:{
            initial: 'prompt',
            id: 'wordplay_green',
            on: {   RECOGNISED:[
                {cond: (context) => "green" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.green.english))},

        /* ==================================================================== WORDPLAY VERBS =================================================================================*/
        wordplay_verbs_begin:{
            initial: 'prompt',
            id: 'wordplay_verbs_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "go" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_run'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_run'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.go.english))},

        wordplay_run:{
            initial: 'prompt',
            id: 'wordplay_run',
            on: {   RECOGNISED:[
                {cond: (context) => "run" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_eat'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_eat'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.run.english))},

        wordplay_eat:{
            initial: 'prompt',
            id: 'wordplay_eat',
            on: {   RECOGNISED:[
                {cond: (context) => "eat" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sleep'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sleep'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.eat.english))},

        wordplay_sleep:{
            initial: 'prompt',
            id: 'wordplay_sleep',
            on: {   RECOGNISED:[
                {cond: (context) => "sleep" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_write'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_write'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.sleep.english))},

        wordplay_write:{
            initial: 'prompt',
            id: 'wordplay_write',
            on: {   RECOGNISED:[
                {cond: (context) => "write" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sing'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sing'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.write.english))},

        wordplay_sing:{
            initial: 'prompt',
            id: 'wordplay_sing',
            on: {   RECOGNISED:[
                {cond: (context) => "sing" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_drink'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_drink'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.sing.english))},

        wordplay_drink:{
            initial: 'prompt',
            id: 'wordplay_drink',
            on: {   RECOGNISED:[
                {cond: (context) => "drink" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.drink.english))},

        /* ===================================================== WORDPLAY FAMILY ===================================================================================================*/
        wordplay_family_begin:{
            initial: 'prompt',
            id: 'wordplay_family_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_brother'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_brother'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.cousin.english))},

        wordplay_brother:{
            initial: 'prompt',
            id: 'wordplay_brother',
            on: {   RECOGNISED:[
                {cond: (context) => "en_brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sister'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sister'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.brother.english))},

        wordplay_sister:{
            initial: 'prompt',
            id: 'wordplay_sister',
            on: {   RECOGNISED:[
                {cond: (context) => "en_sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_mum'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_mum'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.sister.english))},

        wordplay_mum:{
            initial: 'prompt',
            id: 'wordplay_mum',
            on: {   RECOGNISED:[
                {cond: (context) => "en_mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_dad'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_dad'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.mum.english))},

        wordplay_dad:{
            initial: 'prompt',
            id: 'wordplay_dad',
            on: {   RECOGNISED:[
                {cond: (context) => "en_dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_grandma_1'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_grandma_1'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.dad.english))},

        wordplay_grandma_1:{
            initial: 'prompt',
            id: 'wordplay_grandma_1',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_grandma_2'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_grandma_2'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.grandma_1.english))},

        wordplay_grandma_2:{
            initial: 'prompt',
            id: 'wordplay_grandma_2',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.grandma_2.english))},

        /* ===================================================== WORDPLAY GEOGRAPHICAL  ===================================================================================================*/
        wordplay_geographical_begin:{
            initial: 'prompt',
            id: 'wordplay_geographical_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_mountain'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_mountain'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.river.english))},

        wordplay_mountain:{
            initial: 'prompt',
            id: 'wordplay_mountain',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_sea'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_sea'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.mountain.english))},

        wordplay_sea:{
            initial: 'prompt',
            id: 'wordplay_sea',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_forest'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_forest'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.sea.english))},

        wordplay_forest:{
            initial: 'prompt',
            id: 'wordplay_forest',
            on: {   RECOGNISED:[
                {cond: (context) => "en_forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_lake'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_lake'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.forest.english))},

        wordplay_lake:{
            initial: 'prompt',
            id: 'wordplay_lake',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_cliff'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_cliff'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.lake.english))},

        wordplay_cliff:{
            initial: 'prompt',
            id: 'wordplay_cliff',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_cave'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_cave'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.cliff.english))},

        wordplay_cave:{
            initial: 'prompt',
            id: 'wordplay_cave',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#wordplay_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.cave.english))},
    /* ==================================================================== WORDPLAY SUMMARY =================================================================================*/

                            wordplay_summary:{
                                initial: 'prompt',
                                id: 'wordplay_summary',
                                on: {RECOGNISED:[
                                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                                    actions: [cancel('timer2'), cancel('timer')], target:'#wordplay' },
                                    {cond: (context) => "change_game" in (gameGrammar[context.recResult] || {}), 
                                    actions: [cancel('timer2'), cancel('timer')], target:'#which_game' },
                                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                                    actions: [cancel('timer2'), cancel('timer')],  target:'#exit_app' }, 
                                    {target:'.nomatch'}]},
                               ...sayAskTimeout(send((context) => ({
                                type: "SPEAK",
                                value: `Well done! Your current score is ${context.score} points. Would you like to play Wordplay again, or try some other game?`})))


            },
            definitions: {
                initial: 'prompt',
                id: 'definitions',
                on: {
                    RECOGNISED:[{
                        actions: [assign((context) => { return { task: context.recResult } }), cancel('timer'), cancel('timer2')],
                        target: '#definitions_invocation'}],
                        TIMEOUT: '.timeout'
                },
                        ...sayAskTimeout(say("Definitions! Pick a category and let's start."))
    
            },
                definitions_invocation:{
                    initial: 'prompt',
                    id: 'definitions_invocation',
                    states:{
                        prompt: { ...invoke_rasa('#definitions_choice')}
                    }
                },
                definitions_choice:{
                    initial: 'prompt',
                    id: 'definitions_choice',
                    on:{
                        ENDSPEECH:[{
                            cond: (context) => context.intentResult === 'Help',
                            target: 'definitions_help'},
                            {cond: (context) => context.intentResult === 'Quit',
                            target: '#quit_game'},
                            {cond: (context) => context.intentResult === 'Definitions',
                            target: '#definitions_again'},
                            {cond: (context) => context.intentResult === 'Wordplay',
                            target: 'wordplay'},
                            {cond: (context) => context.intentResult === 'Animals',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Weekdays',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Occupation',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Colours',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Verbs',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Family',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
                            {cond: (context) => context.intentResult === 'Geographical',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'definitions_pregame'},
      
                        {target:'.nomatch'}]
                    },
                    states: {
                        prompt: {
                            entry: send('ENDSPEECH')},
                        nomatch: {
                            entry: say("Unavailable right now."),
                            on: {ENDSPEECH: '#welcome'}
                                
                            }
                                
                        }
        
                },
                definitions_again:{
                    id: 'definitions_again',
                    on:{ENDSPEECH:[{
                        actions: assign((context) => { return { task: context.recResult } }),
                        target: '#definitions_invocation'}],
                        TIMEOUT: '.timeout' },
                    ...sayAskTimeout(say('You are already in the Definitions mode! Pick a category to start playing.'))
    
                },
                definitions_help:{
                    initial: 'prompt',
                    id: 'definitions_help',
                    on: {
                        RECOGNISED:[{
                            actions: assign((context) => { return { task: context.recResult } }),
                            target: 'definitions_invocation'},
                        
                        {target: ".nomatch"}]
                    },
                            ...sayAskTimeout(say("Definitions is a game where you will be given a definition in English and will have to say a\
                             corresponding word in Swedish. You can choose from seven categories: Animals, Weekdays, Occupations, Colours, Verbs,\
                            Family, and Nature Objects. Each category consists of seven words. Note that only answers in Swedish will be accepted.\
                            Where applicable, be mindful of articles! You can quit the game by saying quit at any point in the game. You may now pick\
                             a category or change to another game."))
                },
                definitions_quit:{
                    initial: 'prompt',
                    id: 'definitions_quit',
                    on: {ENDSPEECH: '#welcome'},
                   ...sayAskTimeout(say("Quitting definitions. Choose another game. "))
                },
                definitions_pregame:{
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Animals",
                            target: "#definitions_animals_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Weekdays",
                            target: "#definitions_weekdays_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Occupation",
                            target: "#definitions_occupations_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Colours",
                            target: "#definitions_colours_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Verbs",
                            target: "#definitions_verbs_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Family",
                            target: "#definitions_family_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Grographical",
                            target: "#definitions_geographical_begin"},
                            {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                            target: "#quit_game"},
                        { target: ".nomatch" }],
                        ENDSPEECH: '.ask'
                    },
                    states: {
                        prompt:
                            {entry: send((context) => ({
                                    type: "SPEAK",
                             value: `You have chosen ${context.task}. Say start - if you wish to begin; or quit - if you wish to change the game or the mode. Remember to speak in Swedish.`})),
                              on: {ENDSPEECH: 'ask'}},
                        nomatch:{
                            entry: say('Sorry, I did not quite catch that. Please repeat'),
                            on: {ENDSPEECH: 'ask'},
                        },
                        ask: {
                            entry: listen()
                }}},

/*=========================================================================DEFINITIONS ANIMALS===============================================================================================*/                

            definitions_animals_begin:{
            initial: 'prompt',
            id: 'definitions_animals_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cat" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cat" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')],  target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: [cancel('timer2'), cancel('timer')], target:'.nomatch'}],
                    NEXT_STATE: {actions: [cancel('timer2'), cancel('timer')], target: '#definitions_dog'},
                    SKIP_STATE: {actions: [cancel('timer2'), cancel('timer')], target: '#definitions_dog'},
                    TIMEOUT: {actions: [cancel('timer2'), cancel('timer')], target:'.timeout'}
            },
            ...Say_play(say(game_vocab.animals.cat.definition))},

            definitions_dog:{
            initial: 'prompt',
            id: 'definitions_dog',
            on: {   RECOGNISED:[
                {cond: (context) => "en_dog" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "dog" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: [cancel('timer2'), cancel('timer')], target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_fox'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_fox'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.dog.definition))
        },
        definitions_fox:{
            initial: 'prompt',
            id: 'definitions_fox',
            on: {   RECOGNISED:[
                {cond: (context) => "en_fox" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "fox" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sheep'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sheep'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.fox.definition))
            },    
        definitions_sheep:{
            initial: 'prompt',
            id: 'definitions_sheep',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_sheep" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sheep" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target:  '#definitions_giraffe'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_giraffe'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.sheep.definition))
        },          
        definitions_giraffe:{
            initial: 'prompt',
            id: 'definitions_giraffe',
            on: {   RECOGNISED:[
                {cond: (context) => "en_giraffe" in (animalsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "giraffe" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: cancel('timer2'),  target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_crocodile'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_crocodile'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.giraffe.definition))
        },   
        definitions_crocodile:{
            initial: 'prompt',
            id: 'definitions_crocodile',
            on: {   RECOGNISED:[
                {cond: (context) => "en_crocodile" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "crocodile" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_peacock'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_peacock'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.crocodile.definition))
        },      
        definitions_peacock:{
            initial: 'prompt',
            id: 'definitions_peacock',
            on: {   RECOGNISED:[
                {cond: (context) => "en_peacock" in (animalsGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "peacock" in (animalsGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.animals.peacock.definition))
        },

        /* ==================================================================== DEFINITIONS WEEKDAYS =================================================================================*/
        definitions_weekdays_begin:{
            initial: 'prompt',
            id: 'definitions_weekdays_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "Monday" in (weekdaysGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_tuesday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_tuesday'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Monday.definition))},
        
        definitions_tuesday:{
            initial: 'prompt',
            id: 'definitions_tuesday',
            on: {   RECOGNISED:[
                {cond: (context) => "Tuesday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_wednesday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_wednesday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Tuesday.definition))
        },

        definitions_wednesday:{
            initial: 'prompt',
            id: 'definitions_wednesday',
            on: {   RECOGNISED:[
                {cond: (context) => "Wednesday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_thursday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_thursday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Wednesday.definition))
        },

        definitions_thursday:{
            initial: 'prompt',
            id: 'definitions_thursday',
            on: {   RECOGNISED:[
                {cond: (context) => "Thursday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_friday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_friday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Thursday.definition))
        },

        definitions_friday:{
            initial: 'prompt',
            id: 'definitions_friday',
            on: {   RECOGNISED:[
                {cond: (context) => "Friday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_saturday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_saturday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Friday.definition))
        },

        definitions_saturday:{
            initial: 'prompt',
            id: 'definitions_saturday',
            on: {   RECOGNISED:[
                {cond: (context) => "Saturday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sunday'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sunday'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Saturday.definition))
        },

        definitions_sunday:{
            initial: 'prompt',
            id: 'definitions_sunday',
            on: {   RECOGNISED:[
                {cond: (context) => "Sunday" in (weekdaysGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: cancel('timer2'), target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target: '.timeout'}
        },
        ...Say_play(say(game_vocab.weekdays.Sunday.definition))
        },

/* ==================================================================== DEFINITIONS OCCUPATIONS =================================================================================*/
        definitions_occupations_begin:{
            initial: 'prompt',
            id: 'definitions_occupations_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_doctor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_doctor'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.teacher.definition))},

        definitions_doctor:{
            initial: 'prompt',
            id: 'definitions_doctor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_builder'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_builder'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.doctor.definition))},

        definitions_builder:{
            initial: 'prompt',
            id: 'definitions_builder',
            on: {   RECOGNISED:[
                {cond: (context) => "en_builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_lifeguard'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_lifeguard'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.builder.definition))},

        definitions_lifeguard:{
            initial: 'prompt',
            id: 'definitions_lifeguard',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_actor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_actor'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.lifeguard.definition))},

        definitions_actor:{
            initial: 'prompt',
            id: 'definitions_actor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_engineer'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_engineer'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.actor.definition))},

        definitions_engineer:{
            initial: 'prompt',
            id: 'definitions_engineer',
            on: {   RECOGNISED:[
                {cond: (context) => "en_engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_garbage_man'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_garbage_man'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.engineer.definition))},

        definitions_garbage_man:{
            initial: 'prompt',
            id: 'definitions_garbage_man',
            on: {   RECOGNISED:[
                {cond: (context) => "en_garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.occupation.garbage_man.definition))},

/* ==================================================================== DEFINITIONS COLOURS =================================================================================*/
        definitions_colours_begin:{
            initial: 'prompt',
            id: 'definitions_colours_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "yellow" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_red'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_red'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.yellow.definition))},

        definitions_red:{
            initial: 'prompt',
            id: 'definitions_red',
            on: {   RECOGNISED:[
                {cond: (context) => "red" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_purple'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_purple'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.red.definition))},

        definitions_purple:{
            initial: 'prompt',
            id: 'definitions_purple',
            on: {   RECOGNISED:[
                {cond: (context) => "purple" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_brown'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_brown'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.purple.definition))},

        definitions_brown:{
            initial: 'prompt',
            id: 'definitions_brown',
            on: {   RECOGNISED:[
                {cond: (context) => "brown" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_black'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_black'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.brown.definition))},

        definitions_black:{
            initial: 'prompt',
            id: 'definitions_black',
            on: {   RECOGNISED:[
                {cond: (context) => "black" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_white'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_white'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.black.definition))},

        definitions_white:{
            initial: 'prompt',
            id: 'definitions_white',
            on: {   RECOGNISED:[
                {cond: (context) => "white" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_green'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_green'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.white.definition))},

        definitions_green:{
            initial: 'prompt',
            id: 'definitions_green',
            on: {   RECOGNISED:[
                {cond: (context) => "green" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.colours.green.definition))},

        /* ==================================================================== DEFINITIONS VERBS =================================================================================*/
        definitions_verbs_begin:{
            initial: 'prompt',
            id: 'definitions_verbs_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "go" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_run'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_run'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.go.definition))},

        definitions_run:{
            initial: 'prompt',
            id: 'definitions_run',
            on: {   RECOGNISED:[
                {cond: (context) => "run" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_eat'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_eat'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.run.definition))},

        definitions_eat:{
            initial: 'prompt',
            id: 'definitions_eat',
            on: {   RECOGNISED:[
                {cond: (context) => "eat" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sleep'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sleep'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.eat.definition))},

        definitions_sleep:{
            initial: 'prompt',
            id: 'definitions_sleep',
            on: {   RECOGNISED:[
                {cond: (context) => "sleep" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_write'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_write'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.sleep.definition))},

        definitions_write:{
            initial: 'prompt',
            id: 'definitions_write',
            on: {   RECOGNISED:[
                {cond: (context) => "write" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sing'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sing'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.write.definition))},

        definitions_sing:{
            initial: 'prompt',
            id: 'definitions_sing',
            on: {   RECOGNISED:[
                {cond: (context) => "sing" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_drink'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_drink'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.sing.definition))},

        definitions_drink:{
            initial: 'prompt',
            id: 'definitions_drink',
            on: {   RECOGNISED:[
                {cond: (context) => "drink" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.verbs.drink.definition))},

        /* ===================================================== DEFINITIONS FAMILY ===================================================================================================*/
        definitions_family_begin:{
            initial: 'prompt',
            id: 'definitions_family_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_brother'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_brother'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.cousin.definition))},

        definitions_brother:{
            initial: 'prompt',
            id: 'definitions_brother',
            on: {   RECOGNISED:[
                {cond: (context) => "en_brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sister'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sister'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.brother.definition))},

        definitions_sister:{
            initial: 'prompt',
            id: 'definitions_sister',
            on: {   RECOGNISED:[
                {cond: (context) => "en_sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_mum'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_mum'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.sister.definition))},

        definitions_mum:{
            initial: 'prompt',
            id: 'definitions_mum',
            on: {   RECOGNISED:[
                {cond: (context) => "en_mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_dad'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_dad'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.mum.definition))},

        definitions_dad:{
            initial: 'prompt',
            id: 'definitions_dad',
            on: {   RECOGNISED:[
                {cond: (context) => "en_dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_grandma_1'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_grandma_1'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.dad.definition))},

        definitions_grandma_1:{
            initial: 'prompt',
            id: 'definitions_grandma_1',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_grandma_2'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_grandma_2'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.grandma_1.definition))},

        definitions_grandma_2:{
            initial: 'prompt',
            id: 'definitions_grandma_2',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.family.grandma_2.definition))},

        /* ===================================================== DEFINITIONS GEOGRAPHICAL  ===================================================================================================*/
        definitions_geographical_begin:{
            initial: 'prompt',
            id: 'definitions_geographical_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_mountain'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_mountain'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.river.definition))},

        definitions_mountain:{
            initial: 'prompt',
            id: 'definitions_mountain',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_sea'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_sea'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.mountain.definition))},

        definitions_sea:{
            initial: 'prompt',
            id: 'definitions_sea',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_forest'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_forest'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.sea.definition))},

        definitions_forest:{
            initial: 'prompt',
            id: 'definitions_forest',
            on: {   RECOGNISED:[
                {cond: (context) => "en_forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_lake'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_lake'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.forest.definition))},

        definitions_lake:{
            initial: 'prompt',
            id: 'definitions_lake',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_cliff'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_cliff'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.lake.definition))},

        definitions_cliff:{
            initial: 'prompt',
            id: 'definitions_cliff',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_cave'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_cave'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.cliff.definition))},

        definitions_cave:{
            initial: 'prompt',
            id: 'definitions_cave',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer')], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#definitions_summary'},
                    TIMEOUT: {actions: cancel('timer2'), target:'.timeout'}
        },
        ...Say_play(say(game_vocab.geographical.cave.definition))},

/* ==================================================================== DEFINITIONS SUMMARY =================================================================================*/
        
                                definitions_summary:{
                                    initial: 'prompt',
                                    id: 'definitions_summary',
                                    on: {RECOGNISED:[
                                        {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                                        actions: [cancel('timer2'), cancel('timer')], target:'#definitions' },
                                        {cond: (context) => "change_game" in (gameGrammar[context.recResult] || {}), 
                                        actions: [cancel('timer2'), cancel('timer')], target:'#which_game' },
                                        {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                                        actions: [cancel('timer2'), cancel('timer')],  target:'#exit_app' }, 
                                        {target:'.nomatch'}]},
                                   ...sayAskTimeout(send((context) => ({
                                    type: "SPEAK",
                                    value: `Well done! Your current score is ${context.score} points. Would you like to play Definitions again, or try some other game?`})))
    
                },

            pictures: {
                initial: 'prompt',
                id: 'pictures',
                on: {
                    RECOGNISED:[{
                        actions: assign((context) => { return { task: context.recResult } }),
                        target: '#pictures_invocation'}],
                        TIMEOUT: '.timeout'
                },
                        ...sayAskTimeout(say("Pictures! Pick a category and let's start."))
    
            },
                pictures_invocation:{
                    initial: 'prompt',
                    id: 'pictures_invocation',
                    states:{
                        prompt: { ...invoke_rasa('#pictures_choice')}
                    }
                },
                pictures_choice:{
                    initial: 'prompt',
                    id: 'pictures_choice',
                    on:{
                        ENDSPEECH:[{
                            cond: (context) => context.intentResult === 'Help',
                            target: 'pictures_help'},
                            {cond: (context) => context.intentResult === 'Quit',
                            target: '#quit_game'},
                            {cond: (context) => context.intentResult === 'Definitions',
                            target: '#definitions'},
                            {cond: (context) => context.intentResult === 'Wordplay',
                            target: '#wordplay'},
                            {cond: (context) => context.intentResult === 'Pictures',
                            target: '#pictures_again'},
                            {cond: (context) => context.intentResult === 'Animals',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Weekdays',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Occupation',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Colours',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Verbs',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Family',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},
                            {cond: (context) => context.intentResult === 'Geographical',
                            actions: assign((context) => { return { game_category: context.recResult} }),
                            target: 'pictures_pregame'},

        
                        {target:'.nomatch'}]
                    },
                    states: {
                        prompt: {
                            entry: send('ENDSPEECH')},
                        nomatch: {
                            entry: say("Unavailable right now."),
                            on: {ENDSPEECH: '#welcome'}
                                
                            }
                                
                        }
        
                },
                pictures_again:{
                    id: 'pictures_again',
                    on:{ENDSPEECH:[{
                        actions: assign((context) => { return { task: context.recResult } }),
                        target: '#pictures_invocation'}],
                        TIMEOUT: '.timeout' },
                    ...sayAskTimeout(say('You are already in the Pictures mode! Pick a category to start playing.'))
    
                },
                pictures_help:{
                    initial: 'prompt',
                    id: 'pictures_help',
                    on: {
                        RECOGNISED:[{
                            actions: assign((context) => { return { task: context.recResult } }),
                            target: 'pictures_invocation'},
                        
                        {target: ".nomatch"}]
                    },
                            ...sayAskTimeout(say("Pictures is a game where you will be shown a picture and will have to say the Swedish word for it. You can choose from seven categories:\
                            Animals, Weekdays, Occupations, Colours, Verbs, Family, and Nature Objects. Each category consists of seven words. Note that only answers in Swedish will be accepted.\
                            Where applicable, be mindful of articles! You can quit the game by saying quit at any point in the game. You may now pick a category or change another game."))
                },
                pictures_quit:{
                    initial: 'prompt',
                    id: 'pictures_quit',
                    on: {ENDSPEECH: '#welcome'},
                    ...sayAskTimeout(say("Quitting Pictures. Choose another game. "))
                },
                pictures_pregame:{
                    initial: 'prompt',
                    id: 'pictures_pregame',
                    on: {
                        RECOGNISED: [{
                            cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Animals",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: cat}})],
                            target: "#pictures_animals_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Weekdays",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: Monday}})],
                            target: "#pictures_weekdays_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Occupation",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: teacher}})],
                            target: "#pictures_occupations_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Colours",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: yellow}})],
                            target: "#pictures_colours_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Verbs",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: go}})],
                            target: "#pictures_verbs_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Family",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: cousin}})],
                            target: "#pictures_family_begin"},
                            {cond: (context) => "start" in (gameGrammar[context.recResult] || {}) && context.intentResult === "Grographical",
                            actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: river}})],
                            target: "#pictures_geographical_begin"},

                            {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                            target: "#quit_game"},
                        { target: ".nomatch" }],
                        ENDSPEECH: '.ask'
                    },
                    states: {
                        prompt:
                        {entry: send((context) => ({
                            type: "SPEAK",
                            value: `You have chosen ${context.task}. Say start - if you wish to begin; or quit - if you wish to change the game or the mode.`})),
                        on: {ENDSPEECH: 'ask'}},
                        nomatch:{
                            entry: say('Sorry, I did not quite catch that. Please repeat'),
                            on: {ENDSPEECH: 'ask'},
                        },
                        ask: {
                            entry: listen()
                        }
                    }
                },

/* ===================================================== PICTURES ANIMALS ===================================================================================================*/

                pictures_animals_begin:{
                    initial: 'prompt',
                    id: 'pictures_animals_begin',
                    on: {   RECOGNISED:[
                        {cond: (context) => "en_cat" in (animalsGrammar[context.recResult] || {}), 
                        actions: [cancel('timer'), cancel('timer2'), assign((context) => {return { picture: dog, score: (context.score || 0)+1 }})], target: '.match'},
                        {cond: (context) => "cat" in (animalsGrammar[context.recResult] || {}), 
                        actions: [cancel('timer'), cancel('timer2')],  target: '.almost'},
                        {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                        actions: [cancel('timer'),cancel('timer2'),  assign((context) => {return { picture: dog}})],  target: '.skip_to_next'},
                        {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                        actions: [assign((context) => {return {picture: Background}}), cancel('timer')], target: '#quit_game'},
    
                        {target:'.nomatch'}],
                            NEXT_STATE: {target: '#pictures_dog'},
                            SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_dog'},
                            SHOW: {target: '.show'},
                },
                ...Show_play()},

            pictures_dog:{
                initial: 'prompt',
                id: 'pictures_dog',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_dog" in (animalsGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return { picture: fox, score: (context.score || 0)+1 }})], target: '.match',},
                    {cond: (context) => "dog" in (animalsGrammar[context.recResult] || {}),
                    target: '.almost'},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: fox}})],target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})], target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target: '#pictures_fox'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_fox'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()
        },
            pictures_fox:{
                initial: 'prompt',
                id: 'pictures_fox',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_fox" in (animalsGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: sheep, score: (context.score || 0)+1 }})], target: '.match',},
                    {cond: (context) => "fox" in (animalsGrammar[context.recResult] || {}), 
                    target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return { picture: sheep}})], target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})], target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target: '#pictures_sheep'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sheep'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()
        },    
            pictures_sheep:{
                initial: 'prompt',
                id: 'pictures_sheep',
                on: {   RECOGNISED:[
                    {cond: (context) => "ett_sheep" in (animalsGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: giraffe, score: (context.score || 0)+1}})], target: '.match',},
                    {cond: (context) => "sheep" in (animalsGrammar[context.recResult] || {}), 
                    target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: giraffe}})], target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})], target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target:  '#pictures_giraffe'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_giraffe'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()
        },          
            pictures_giraffe:{
                initial: 'prompt',
                id: 'pictures_giraffe',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_giraffe" in (animalsGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: crocodile, score: (context.score || 0)+1}})], target: '.match',},
                    {cond: (context) => "giraffe" in (animalsGrammar[context.recResult] || {}), 
                    target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return { picture: crocodile}})],  target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})], target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target: '#pictures_crocodile'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_crocodile'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()
        },   
            pictures_crocodile:{
                initial: 'prompt',
                id: 'pictures_crocodile',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_crocodile" in (animalsGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return { picture: peacock, score: (context.score || 0)+1}})],  target: '.match',},
                    {cond: (context) => "crocodile" in (animalsGrammar[context.recResult] || {}), 
                    target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return { picture: peacock}})], target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})], target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target: '#pictures_peacock'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_peacock'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()
        },  

            pictures_peacock:{
                initial: 'prompt',
                id: 'pictures_peacock',
                on: {   RECOGNISED:[
                    {cond: (context) => "en_peacock" in (animalsGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return {picture: Background, score: (context.score || 0)+1}})],  target: '.match',},
                    {cond: (context) => "peacock" in (animalsGrammar[context.recResult] || {}), 
                     target: '.almost',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return {picture: Background}})], target: '.skip_to_next'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Background}})],
                    target: '#quit_game'},
    
                    {target:'.nomatch'}],
                        NEXT_STATE: {target: '#pictures_summary'},
                        SKIP_STATE: {target: '#pictures_summary'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()},
            

/* ==================================================================== PICTURES WEEKDAYS =================================================================================*/
            pictures_weekdays_begin:{
                initial: 'prompt',
                id: 'pictures_weekdays_begin',
                on: {   RECOGNISED:[
                    {cond: (context) => "Monday" in (weekdaysGrammar[context.recResult] || {}), 
                    actions: [assign((context) => {return {picture: Tuesday, score: (context.score || 0)+1}})],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                    actions: [assign((context) => {return { picture: Tuesday}})], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],

                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_tuesday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_tuesday'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()},

            pictures_tuesday:{
                initial: 'prompt',
                id: 'pictures_tuesday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Tuesday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Wednesday, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Wednesday} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_wednesday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_wednesday'},
                        SHOW: {target: '.show'}

            },
            ...Show_play()},

            pictures_wednesday:{
                initial: 'prompt',
                id: 'pictures_wednesday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Wednesday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Thursday, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Thursday} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_thursday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_thursday'},
                        SHOW: {target: '.show'}

            },
            ...Show_play()},


            pictures_thursday:{
                initial: 'prompt',
                id: 'pictures_thursday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Thursday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Friday, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Friday} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_friday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_friday'},
                        SHOW: {target: '.show'}

            },
            ...Show_play()},

            pictures_friday:{
                initial: 'prompt',
                id: 'pictures_friday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Friday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Saturday, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Saturday} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_saturday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_saturday'},
                        SHOW: {target: '.show'}

            },
            ...Show_play()},

            pictures_saturday:{
                initial: 'prompt',
                id: 'pictures_saturday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Saturday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Sunday, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Sunday} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_sunday'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sunday'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()},

            pictures_sunday:{
                initial: 'prompt',
                id: 'pictures_sunday',
                on: {   RECOGNISED:[
                    {cond: (context) => "Sunday" in (weekdaysGrammar[context.recResult] || {}),
                    actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: Background, score: (context.score || 0)+1 } })],  target: '.match',},
                    {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                    {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                    {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                    actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                    {actions: cancel('timer2'), target:'.nomatch'}],
                        NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                        SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                        SHOW: {target: '.show'}
            },
            ...Show_play()},

            /* ==================================================================== PICTURES OCCUPATIONS =================================================================================*/
        pictures_occupations_begin:{
            initial: 'prompt',
            id: 'pictures_occupations_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return {picture: doctor, score: (context.score || 0)+1 } })],  target: '.match',},
                {cond: (context) => "teacher" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')],  target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), assign((context)=>{ return {picture: doctor} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],
                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_doctor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_doctor'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_doctor:{
            initial: 'prompt',
            id: 'pictures_doctor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: builder, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "doctor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: builder} }) ], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_builder'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_builder'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_builder:{
            initial: 'prompt',
            id: 'pictures_builder',
            on: {   RECOGNISED:[
                {cond: (context) => "en_builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: lifeguard, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "builder" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: lifeguard} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_lifeguard'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_lifeguard'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_lifeguard:{
            initial: 'prompt',
            id: 'pictures_lifeguard',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: actor, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lifeguard" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: actor} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_actor'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_actor'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_actor:{
            initial: 'prompt',
            id: 'pictures_actor',
            on: {   RECOGNISED:[
                {cond: (context) => "en_actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: engineer, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "actor" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: engineer} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_engineer'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_engineer'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_engineer:{
            initial: 'prompt',
            id: 'pictures_engineer',
            on: {   RECOGNISED:[
                {cond: (context) => "en_engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: garbage_man, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "engineer" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: garbage_man} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_garbage_man'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_garbage_man'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_garbage_man:{
            initial: 'prompt',
            id: 'pictures_garbage_man',
            on: {   RECOGNISED:[
                {cond: (context) => "en_garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: Background, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "garbage_man" in (occupationsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

/* ==================================================================== PICTURES COLOURS =================================================================================*/
        pictures_colours_begin:{
            initial: 'prompt',
            id: 'pictures_colours_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "yellow" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: red, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: red} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_red'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_red'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_red:{
            initial: 'prompt',
            id: 'pictures_red',
            on: {   RECOGNISED:[
                {cond: (context) => "red" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: purple, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: purple} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_purple'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_purple'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_purple:{
            initial: 'prompt',
            id: 'pictures_purple',
            on: {   RECOGNISED:[
                {cond: (context) => "purple" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: brown, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: brown} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_brown'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_brown'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_brown:{
            initial: 'prompt',
            id: 'pictures_brown',
            on: {   RECOGNISED:[
                {cond: (context) => "brown" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: black, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: black} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_black'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_black'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_black:{
            initial: 'prompt',
            id: 'pictures_black',
            on: {   RECOGNISED:[
                {cond: (context) => "black" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: white, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: white} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_white'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_white'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_white:{
            initial: 'prompt',
            id: 'pictures_white',
            on: {   RECOGNISED:[
                {cond: (context) => "white" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: green, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: green} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_green'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_green'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_green:{
            initial: 'prompt',
            id: 'pictures_green',
            on: {   RECOGNISED:[
                {cond: (context) => "green" in (coloursGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: Background, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        /* ==================================================================== PICTURES VERBS =================================================================================*/
        pictures_verbs_begin:{
            initial: 'prompt',
            id: 'pictures_verbs_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "go" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: run, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: run} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_run'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_run'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_run:{
            initial: 'prompt',
            id: 'pictures_run',
            on: {   RECOGNISED:[
                {cond: (context) => "run" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: eat, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: eat} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_eat'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_eat'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_eat:{
            initial: 'prompt',
            id: 'pictures_eat',
            on: {   RECOGNISED:[
                {cond: (context) => "eat" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: sleep, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: sleep} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_sleep'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sleep'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_sleep:{
            initial: 'prompt',
            id: 'pictures_sleep',
            on: {   RECOGNISED:[
                {cond: (context) => "sleep" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: write, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: write} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_write'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_write'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_write:{
            initial: 'prompt',
            id: 'pictures_write',
            on: {   RECOGNISED:[
                {cond: (context) => "write" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: sing, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: sing} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_sing'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sing'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_sing:{
            initial: 'prompt',
            id: 'pictures_sing',
            on: {   RECOGNISED:[
                {cond: (context) => "sing" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: drink, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: drink} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_drink'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_drink'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_drink:{
            initial: 'prompt',
            id: 'pictures_drink',
            on: {   RECOGNISED:[
                {cond: (context) => "drink" in (verbsGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: Background, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

/* ===================================================== PICTURES FAMILY ===================================================================================================*/
        pictures_family_begin:{
            initial: 'prompt',
            id: 'pictures_family_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: brother, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cousin" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: brother} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_brother'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_brother'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_brother:{
            initial: 'prompt',
            id: 'pictures_brother',
            on: {   RECOGNISED:[
                {cond: (context) => "en_brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: sister, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "brother" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: sister} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_sister'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sister'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_sister:{
            initial: 'prompt',
            id: 'pictures_sister',
            on: {   RECOGNISED:[
                {cond: (context) => "en_sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: mum, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sister" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: mum} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_mum'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_mum'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_mum:{
            initial: 'prompt',
            id: 'pictures_mum',
            on: {   RECOGNISED:[
                {cond: (context) => "en_mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: dad, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mum" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: dad} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_dad'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_dad'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_dad:{
            initial: 'prompt',
            id: 'pictures_dad',
            on: {   RECOGNISED:[
                {cond: (context) => "en_dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: grandma_1, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "dad" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: grandma_1} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_grandma_1'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_grandma_1'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_grandma_1:{
            initial: 'prompt',
            id: 'pictures_grandma_1',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: grandma_2, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_1" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: grandma_2} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_grandma_2'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_grandma_2'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_grandma_2:{
            initial: 'prompt',
            id: 'pictures_grandma_2',
            on: {   RECOGNISED:[
                {cond: (context) => "en_grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: Background, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "grandma_2" in (familyGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        /* ===================================================== PICTURES GEOGRAPHICAL  ===================================================================================================*/
        pictures_geographical_begin:{
            initial: 'prompt',
            id: 'pictures_geographical_begin',
            on: {   RECOGNISED:[
                {cond: (context) => "en_river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: mountain, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "river" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: mountain} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_mountain'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_mountain'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_mountain:{
            initial: 'prompt',
            id: 'pictures_mountain',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: sea, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "mountain" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: sea} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_sea'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_sea'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_sea:{
            initial: 'prompt',
            id: 'pictures_sea',
            on: {   RECOGNISED:[
                {cond: (context) => "ett_sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: forest, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "sea" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: forest} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_forest'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_forest'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_forest:{
            initial: 'prompt',
            id: 'pictures_forest',
            on: {   RECOGNISED:[
                {cond: (context) => "en_forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: lake, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "forest" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: lake} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_lake'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_lake'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_lake:{
            initial: 'prompt',
            id: 'pictures_lake',
            on: {   RECOGNISED:[
                {cond: (context) => "en_lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: cliff, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "lake" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: cliff} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_cliff'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_cliff'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_cliff:{
            initial: 'prompt',
            id: 'pictures_cliff',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: cave, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cliff" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: cave} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_cave'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_cave'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},

        pictures_cave:{
            initial: 'prompt',
            id: 'pictures_cave',
            on: {   RECOGNISED:[
                {cond: (context) => "en_cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context)=>{ return { picture: Background, score: (context.score || 0)+1 } })], target: '.match',},
                {cond: (context) => "cave" in (geographicalGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.almost',},
                {cond: (context) => "skip" in (gameGrammar[context.recResult] || {}),
                actions: [cancel('timer2'), cancel('timer'),assign((context)=>{ return {picture: Background} })], target: '.skip_to_next'},
                {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer')], target: '.prompt'},
                {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}), 
                actions: [cancel('timer2'), cancel('timer'), assign((context) => {return {picture: Background}})], target: '#quit_game'},

                {actions: cancel('timer2'), target:'.nomatch'}],

                    NEXT_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SKIP_STATE: {actions: cancel('timer2'), target: '#pictures_summary'},
                    SHOW: {target: '.show'}
        },
        ...Show_play()},
        
                                pictures_summary:{
                                    initial: 'prompt',
                                    id: 'pictures_summary',
                                    on: {RECOGNISED:[
                                        {cond: (context) => "repeat" in (gameGrammar[context.recResult] || {}), 
                                        actions: [cancel('timer2'), cancel('timer')], target:'#pictures' },
                                        {cond: (context) => "change_game" in (gameGrammar[context.recResult] || {}), 
                                        actions: [cancel('timer2'), cancel('timer')], target:'#which_game' },
                                        {cond: (context) => "quit" in (gameGrammar[context.recResult] || {}),
                                        actions: [cancel('timer2'), cancel('timer')],  target:'#exit_app' }, 
                                        {target:'.nomatch'}]},
                                   ...sayAskTimeout(send((context) => ({
                                    type: "SPEAK",
                                    value: `Well done! Your current score is ${context.score} points. Would you like to guess pictures again, or try some other game?`})))
        
        
                    },


        quit_game:{
            initial: 'prompt',
            id:'quit_game',
            on: {ENDSPEECH: '#which_game'},
            states: {
                prompt:{entry: say('Exiting current game.')

                }
            }
        },
        exit_app:{
            id: 'exit_app',
            on: {ENDSPEECH: '#idle'},
            entry: say('Thank you for playing and have a nice day!')
        }
}})

import Background from "./Pictures_game/Background.jpg";
import cat from "./Pictures_game/cat.jpg";
import dog from "./Pictures_game/dog.jpeg";
import fox from "./Pictures_game/fox.jpg";
import sheep from "./Pictures_game/sheep.jpg";
import giraffe from "./Pictures_game/giraffe.jpeg";
import crocodile from "./Pictures_game/crocodile.jpg";
import peacock from "./Pictures_game/peacock.jpg";

import Monday from "./Pictures_game/Monday.jpg";
import Tuesday from "./Pictures_game/Tuesday.jpg";
import Wednesday from "./Pictures_game/Wednesday.jpeg";
import Thursday from "./Pictures_game/Thursday.jpg";
import Friday from "./Pictures_game/Friday.jpg";
import Saturday from "./Pictures_game/Saturday.jpg";
import Sunday from "./Pictures_game/Sunday.jpg";

import teacher from "./Pictures_game/Teacher.jpeg";
import doctor from "./Pictures_game/Doctor.png";
import builder from "./Pictures_game/Builder.jpg";
import lifeguard from "./Pictures_game/Lifeguard.jpg";
import actor from "./Pictures_game/Actor.jpg";
import engineer from "./Pictures_game/Engineer.png";
import garbage_man from "./Pictures_game/Garbage_man.jpeg";

import yellow from "./Pictures_game/yellow.jpg";
import red from "./Pictures_game/red.jpg";
import purple from "./Pictures_game/purple.png";
import brown from "./Pictures_game/brown.jpg";
import black from "./Pictures_game/black.jpg";
import white from "./Pictures_game/white.jpg";
import green from "./Pictures_game/green.jpg";

import go from "./Pictures_game/go.png";
import run from "./Pictures_game/run.jpg";
import eat from "./Pictures_game/eat.jpg";
import sleep from "./Pictures_game/sleep.jpg";
import write from "./Pictures_game/write.jpg";
import sing from "./Pictures_game/sing.jpg";
import drink from "./Pictures_game/drink.jpg";

import cousin from "./Pictures_game/cousin.jpg";
import brother from "./Pictures_game/brother.jpeg";
import sister from "./Pictures_game/sister.jpg";
import mum from "./Pictures_game/mother.jpg";
import dad from "./Pictures_game/dad.jpg";
import grandma_1 from "./Pictures_game/grandma_1.jpg";
import grandma_2 from "./Pictures_game/grandma_2.jpg";

import river from "./Pictures_game/river.png";
import mountain from "./Pictures_game/mountain.jpg";
import sea from "./Pictures_game/sea.jpg";
import forest from "./Pictures_game/forest.jpg";
import lake from "./Pictures_game/lake.jpg";
import cliff from "./Pictures_game/cliff.jpg";
import cave from "./Pictures_game/cave.jpg";
