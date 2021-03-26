/// <reference types="react-scripts" />

declare module 'react-speech-kit';

interface SDSContext {
    recResult: any;
    nluData: any;
    ttsAgenda: string;
    answer: string;
    task: any;
    intentResult: any;
    game_category: any,

    skip: string;

    cat: string;
    en_cat: string;
    dog: string;
    en_dog: string;
    fox: string;
    en_fox: string;
    giraffe: string;
    en_giraffe: string;
    peacock: string;
    en_peacock:string;
    crocodile:string;
    en_crocodile:string;
    sheep:string;
    ett_sheep:string

    Monday:string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;

    teacher:string;
    en_teacher: string;
    doctor: string;
    en_doctor: string;
    lifeguard:string;
    en_lifeguard: string;
    actor: string;
    en_actor: string;
    engineer: string;
    en_engineer: string;
    garbage_man: string;
    en_garbage_man: string;

    yellow:string;
    red:string;
    purple:string;
    brown:string;
    black:string;
    white:string;
    green:string;

    go:string;
    run:string;
    eat:string;
    sleep:string;
    write:string;
    sing:string;
    drink:string;

    cousin:string;
    en_cousin:string;
    brother:string;
    en_brother:string;
    sister:string;
    en_sister:string;
    mum:string;
    en_mum:string;
    dad:string;
    en_dad:string;
    grandma_1:string;
    en_grandma_1:string;
    grandma_2:string;
    en_grandma_2:string;

    river:string;
    en_river:string;
    mountain:string;
    ett_mountain:string;
    sea:string;
    ett_sea:string;
    forest:string;
    en_forest:string;
    lake:string;
    en_lake:string;
    cliff:string;
    en_cliff:string;
    cave:string;
    en_cave:string;

    count: any;
    score: number;

    picture: any
    repeat: string;
    change_game: string;
    quit: string;

}

type SDSEvent =
    | { type: 'CLICK' }
    | { type: 'RECOGNISED' }
    | { type: 'ASRRESULT', value: string }
    | { type: 'ENDSPEECH' }
    | { type: 'LISTEN' }
    | { type: 'SPEAK', value: string }
    | { type: 'TIMEOUT' }
    | { type: 'NEXT_WORD' }
    | { type: 'NEXT_STATE' }
    | { type: 'SKIP_STATE' }
    | { type: 'SHOW' }





