import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Machine, assign, send, State } from "xstate";
import { useMachine, asEffect } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { dmMachine } from "./dmSwenglish";
import Background from "./Pictures_game/Background.jpg";


/*inspect({
    url: "https://statecharts.io/inspect",
    iframe: false
});
*/

import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';

let counterScore = 0
let counterTimeout = 0

const machine = Machine<SDSContext, any, SDSEvent>({
    id: 'root',
    type: 'parallel',
    states: {
        dm: {
            ...dmMachine
        },
        asrtts: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        LISTEN: 'recognising',
                        SPEAK: {
                            target: 'speaking',
                            actions: assign((_context, event) => { return { ttsAgenda: event.value } })
                        }
                    }
                },
                recognising: {
                    initial: 'progress',
                    entry: 'recStart',
                    exit: 'recStop',
                    on: {
                        ASRRESULT: {
                            actions: ['recLogResult',
                                assign((_context, event) => { return { recResult: event.value } })],
                            target: '.match'
                        },
                        RECOGNISED: 'idle',
                        NEXT_STATE: {
                            actions: assign((context) => {
                                if (context.score) {return {score: context.score +1,}}
                                else {return {score: counterScore +1}}
                            }),
                            target: 'idle'
                        },
                        TIMEOUT: {
                            actions: assign((context) => {
                                if (context.count) {return {count: context.count +1,}}
                                else {return {count: counterTimeout +1,}}
                            }),
                            target: 'idle'
                        }
                    },
                    states: {
                        progress: {},
                        match: {
                            entry: send('RECOGNISED'),
                        },
                    }
                },
                speaking: {
                    entry: 'ttsStart',
                    on: {
                        ENDSPEECH: 'idle',
                    }
                }
            }
        }
    },
},
    {
        actions: {
            recLogResult: (context: SDSContext) => {
                /* context.recResult = event.recResult; */
                console.log('<< ASR: ' + context.recResult);
            },
            test: () => {
                console.log('test')
            },
            logIntent: (context: SDSContext) => {
                /* context.nluData = event.data */
                console.log('<< NLU intent: ' + context.nluData.intent.name)
            }
        },
    });


interface Props extends React.HTMLAttributes<HTMLElement> {
    state: State<SDSContext, any, any, any>;
}
const ReactiveButton = (props: Props): JSX.Element => {
    switch (true) {
        case props.state.matches({ asrtts: 'recognising' }):
            return (<div>                
                <p>{props.state.context.recResult}</p>
    
                <button type="button" className="glow-on-hover"
                    style={{ animation: "glowing 20s linear" }} 

                    {...props}>
                    Listening...
                </button>
                </div>
            );
        case props.state.matches({ asrtts: 'speaking' }
        ):
            return (<div>
                <p>{props.state.context.recResult}</p>
                <button type="button" className="glow-on-hover"
                    style={{ animation: "bordering 1s infinite" }} {...props}>
                    Speaking...
                </button></div>
            );
        default:
            return (
                <div>
                <p>{props.state.context.recResult}</p>
                <button type="button" className="glow-on-hover" {...props}>
                    Click to start
                </button >
                </div>
            );
    }
}

function App() {
    const { speak, cancel, speaking } = useSpeechSynthesis({
        onEnd: () => {
            send('ENDSPEECH');
        },
    });
    const { listen, listening, stop } = useSpeechRecognition({
        onResult: (result: any) => {
            send({ type: "ASRRESULT", value: result });
        },
    });
    const [current, send, service] = useMachine(machine, {
        devTools: true,
        actions: {
            recStart: asEffect(() => {
                console.log('Ready to receive a color command.');
                listen({
                    interimResults: false,
                    continuous: true,
                    language: 'sv-Se'
                });
            }),
            recStop: asEffect(() => {
                console.log('Recognition stopped.');
                stop()
            }),
            ttsStart: asEffect((context, effect) => {
                console.log('Speaking...');
                speak({ text: context.ttsAgenda })
            }),
            ttsCancel: asEffect((context, effect) => {
                console.log('TTS STOP...');
                cancel()
            })
            /* speak: asEffect((context) => {
	     * console.log('Speaking...');
             *     speak({text: context.ttsAgenda })
             * } */
        }
    });

    let shown_picture = Background;
    if (current.context.picture) {shown_picture = current.context.picture}
    
    return (
        <div className="App">
        <h1>
        <   ReactiveButton state={current} onClick={() => send('CLICK')} />
        </h1>
        <h2>
            <div><img src={shown_picture}/></div>
        </h2>
        </div>
    )
};

const rootElement = document.getElementById("root");
ReactDOM.render(
    <App />,
    rootElement);