export const animalsGrammar: { [index: string]: {cat?: string, en_cat?:string, dog?:string, en_dog?:string, fox?:string, en_fox?:string,  
    sheep?:string, ett_sheep?:string, peacock?: string, en_peacock?:string, crocodile?:string, en_crocodile?:string, giraffe?:string,
    en_giraffe?:string}} ={
        "katt" : {cat: "cat"},
        "en katt" : {en_cat: "cat"},
    
        "hund" : {dog: "dog"},
        "en hund" : {en_dog: "dog"},
    
        "räv": {fox: "fox"},
        "en räv": {en_fox: "fox"},
    
        "får": {sheep: "sheep"},
        "ett får": {ett_sheep: "sheep"},
    
        "giraff": {giraffe: "griffe"},
        "en giraff": {en_giraffe: "giraffe"},
    
        "krokodil": {crocodile: "crocodile"},
        "en krokodil": {en_crocodile: "crocodile"},
    
        "påfågel": {peacock: "peacock"},
        "en påfågel": {en_peacock: "peacock"}
    }

export const weekdaysGrammar: { [index: string]: {Monday?: string, Tuesday?:string, Wednesday?:string, Thursday?:string, Friday?:string, Saturday?:string,  
    Sunday?:string}} ={
        "Måndag" : {Monday: "Monday"},
        "måndag" : {Monday: "Monday"},
        "en måndag" : {Monday: "Monday"},
        "en Måndag" : {Monday: "Monday"},

        "Tisdag" : {Tuesday: "Tuesday"},
        "tisdag" : {Tuesday: "Tuesday"},
        "en Tisdag" : {Tuesday: "Tuesday"},
        "en tisdag" : {Tuesday: "Tuesday"},

        "Onsdag": {Wednesday: "Wednesday"},
        "onsdag": {Wednesday: "Wednesday"},
        "en Onsdag": {Wednesday: "Wednesday"},
        "en onsdag": {Wednesday: "Wednesday"},

        "Torsdag": {Thursday: "Thursday"},
        "torsdag": {Thursday: "Thursday"},
        "en Torsdag": {Thursday: "Thursday"},
        "en torsdag": {Thursday: "Thursday"},

        "Fredag": {Friday: "Friday"},
        "fredag": {Friday: "Friday"},
        "en Fredag": {Friday: "Friday"},
        "en fredag": {Friday: "Friday"},

        "Lördag": {Saturday: "Saturday"},
        "lördag": {Saturday: "Saturday"},
        "en Lördag": {Saturday: "Saturday"},
        "en lördag": {Saturday: "Saturday"},

        "Söndag": {Sunday: "Sunday"},
        "söndag": {Sunday: "Sunday"},
        "en Söndag": {Sunday: "Sunday"},
        "en söndag": {Sunday: "Sunday"},
    }

    
export const gameGrammar: { [index: string]: {start?: string, quit?: string, skip?: string, repeat?: string, change_game?: string}} = {

    "start": {start: "start"},
    "begin": {start: "start"},
    "let's begin": {start: "start"},

    "go back": {quit: "quit"},
    "back": {quit: "quit"},
    "return": {quit: "quit"},
    "quit": {quit: "quit"},
    "I wish to quit": {quit: "quit"},
    "stop": {quit: "quit"},
    "pause": {quit: "quit"},
    "I give up": {quit: "quit"},
    "give up": {quit: "quit"},



    "skip": {skip: 'skip'},
    "pass": {skip: 'skip'},
    "skip this one": {skip: 'skip'},
    "skip it": {skip: 'skip'},
    "next": {skip: 'skip'},

    "repeat": {repeat: 'repeat'},
    "play pictures again": {repeat: 'repeat'},
    "I would like to pictures again": {repeat: 'repeat'},
    "let's play pictures": {repeat: 'repeat'},
    "let's play pictures again": {repeat: 'repeat'},
    "let's try pictures again": {repeat: 'repeat'},
    "Let's try words again": {repeat: 'repeat'},
    "I would like to guess pictures again": {repeat: 'repeat'},
    "let's guess pictures": {repeat: 'repeat'},
    "let's guess pictures again": {repeat: 'repeat'},
    "Let's try pictures again": {repeat: 'repeat'},
    "play definitions again": {repeat: 'repeat'},
    "I would like to definitions again": {repeat: 'repeat'},
    "let's play definitions": {repeat: 'repeat'},
    "let's play definitions again": {repeat: 'repeat'},
    "Let's try definitions again": {repeat: 'repeat'},
    "play wordplay again": {repeat: 'repeat'},
    "I would like to wordplay again": {repeat: 'repeat'},
    "let's play wordplay": {repeat: 'repeat'},
    "let's play wordplay again": {repeat: 'repeat'},
    "play words again": {repeat: 'repeat'},
    "I would like to words again": {repeat: 'repeat'},
    "let's play words": {repeat: 'repeat'},
    "let's play words again": {repeat: 'repeat'},
    "Let's play words again": {repeat: 'repeat'},
    "pictures": {repeat: 'repeat'},
    "Pictures": {repeat: 'repeat'},
    "Definitions": {repeat: 'repeat'},
    "Words": {repeat: 'repeat'},
    "words": {repeat: 'repeat'},

    
    "I would like to guess words again": {repeat: 'repeat'},
    "let's guess words": {repeat: 'repeat'},
    "let's guess words again": {repeat: 'repeat'},

    "I would like to guess definitions again": {repeat: 'repeat'},
    "let's guess definitions": {repeat: 'repeat'},
    "let's guess definitions again": {repeat: 'repeat'},

    "yes": {repeat: 'repeat'},

    "come again ": {repeat: 'repeat'},

    "I didn't hear you": {repeat: 'repeat'},
    "say again": {repeat: 'repeat'},
    "repeat question": {repeat: 'repeat'},
    "repeat the question": {repeat: 'repeat'},
    "again": {repeat: 'repeat'},
    "restart": {repeat: 'repeat'},
    "play again": {repeat: 'repeat'},
    "same category": {repeat: 'repeat'},

    "change game": {change_game: 'change_game'},
    "change category": {change_game: 'change_game'},
    "other category": {change_game: 'change_game'},
    "categories": {change_game: 'change_game'},
    "another": {change_game: 'change_game'},
    "another game": {change_game: 'change_game'},
    "change": {change_game: 'change_game'},
    "different": {change_game: 'change_game'},
    "something else": {change_game: 'change_game'},
    "let's try something else something else": {change_game: 'change_game'},
    "I want to try something else something else": {change_game: 'change_game'}

}

export const occupationsGrammar: { [index: string]: {teacher?: string, en_teacher?: string, doctor?:
     string, en_doctor?: string, builder?: string, en_builder?: string, lifeguard?: string, en_lifeguard?: string,
     actor?: string, en_actor?: string, engineer?: string, en_engineer?: string, garbage_man?: string,
     en_garbage_man?: string}} = {

    "lärare": {teacher: "teacher"},
    "en lärare": {en_teacher: "teacher"},

    "läkare": {doctor: "doctor"},
    "en läkare": {en_doctor: "doctor"},

    "byggare": {builder: "builder"},
    "en byggare": {en_builder: "builder"},

    "badvakt": {lifeguard: "lifeguard"},
    "en badvakt": {en_lifeguard: "lifeguard"},

    "skådespelare": {actor: "actor"},
    "en skådespelare": {en_actor: "actor"},

    "ingengör": {engineer: "engineer"},
    "en ingengör": {en_engineer: "engineer"},

    "sopgubbe": {garbage_man: "garbage man"},
    "sop gubbe": {garbage_man: "garbage man"},
    "en sopgubbe": {en_garbage_man: "garbage man"},
    "en sop gubbe": {en_garbage_man: "garbage man"},

}

export const coloursGrammar:{ [index: string]: {yellow?: string, red?: string, purple?: string, brown?: string, black?: string, white?: string, green?: string}} = {
    
    "gul": {yellow: "yellow"},
    "röd": {red: "red"},
    "lila": {purple: "purple"},
    "brun": {brown: "brown"},
    "Brun": {brown: "brown"},

    "svart": {black: "black"},
    "vit": {white: "white"},
    "grön": {green: "green"},
}

export const verbsGrammar:{ [index: string]: {go?: string, run?: string, eat?:string, sleep?:string, write?: string, sing?: string, drink?: string}} = {
    
    "gå": {go: "go"},
    "springa": {run: "run"},
    "äta": {eat: "eat"},
    "sova": {sleep: "sleep"},
    "skriva": {write: "write"},
    "sjunga": {sing: "sing"},
    "dricka": {drink: "drink"},   
}

export const familyGrammar:{ [index: string]: {cousin?: string, en_cousin?: string, brother?: string, en_brother?: string, 
    sister?: string, en_sister?: string, mum?: string, en_mum?: string, dad?: string, en_dad?: string, grandma_1?: string, 
    en_grandma_1?: string, grandma_2?: string, en_grandma_2?: string}} = {
    
    "kusin": {cousin: "cousin"},
    "en kusin" :{en_cousin: "cousin"},

    "bror": {brother: "brother"},
    "en bror": {en_brother: "brother"},

    "syster": {sister: "sister"},
    "en syster": {en_sister: "sister"},

    "mamma": {mum: "mum"},
    "mor": {mum: "mum"},

    "en mor": {en_mum: "mum"},
    "en mamma": {en_mum: "mum"},

    "pappa": {dad: "dad"},
    "far": {dad: "dad"},

    "en pappa": {en_dad: "dad"},
    "en far": {en_dad: "dad"},

    "mormor": {grandma_1: "grandma from your mother's side"},
    "en mormor": {en_grandma_1: "grandma from your mother's side"},

    "farmor": {grandma_2: "grandma from your father's side"},
    "en farmor": {en_grandma_2: "grandma from your father's side"},
}

export const geographicalGrammar:{ [index: string]: {river?: string, en_river?: string, mountain?: string, ett_mountain?: string, 
    sea?: string, ett_sea?: string, forest?: string, en_forest?: string, lake?: string, en_lake?: string, cliff?: string, 
    en_cliff?: string, cave?: string, en_cave?: string}} = {

    "flod": {river: "river"},
    "en flod": {en_river: "river"},

    "berg": {mountain: "mountain"},
    "ett berg": {ett_mountain: "mountain"},

    "hav": {sea: "sea"},
    "ett hav": {ett_sea: "sea"},

    "skog": {forest: "forest"},
    "en skog": {en_forest: "forest"},

    "sjö": {lake: "lake"},
    "en sjö": {en_lake: "lake"},

    "klippa": {cliff: "cliff"},
    "en klippa": {en_cliff: "cliff"},

    "grotta": {cave: "cave"},
    "en grotta": {en_cave: "cave"},
    
}

