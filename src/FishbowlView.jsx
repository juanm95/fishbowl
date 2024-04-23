import { FishbowlController, Stages } from "./FishbowlController"
import { useState, useCallback, useRef, useEffect } from "react";
function FishbowlDone({controller, fishbowlState, setFishbowlState}) {
    const sortedTeams = [...fishbowlState.teams].sort((a, b) => {
        return b.points - a.points;
    });
    const winningTeam = sortedTeams[0];
    const winningTeamName = winningTeam.name;
    const winningTeamPoints = winningTeam.points;
    const losingTeams = sortedTeams.slice(1, 3);
    const onChangeCards = useCallback(() => {
        controller.current.changeCards();
        setFishbowlState({...controller.current});
    });

    const onChangeRules = useCallback(() => {
        controller.current.resetGame();
        setFishbowlState({...controller.current});
    });

    return (
        <div>
            <div>
                <div>{winningTeamName} Won!</div>
                <div>{winningTeamPoints} Points</div>
            </div>
            <div>
                {losingTeams.map((team) => {
                    return (
                        <div>
                            <span>{team.name}</span>
                            <span> {team.points}pts</span>
                        </div>
                    );
                })}
            </div>
            <button onClick={onChangeCards}>Change Cards</button>
            <button onClick={onChangeRules}>Change Rules</button>
        </div>
    );
}

function FishbowlPlay({controller, fishbowlState, setFishbowlState}) {
    const currentTeamName = fishbowlState.teams[fishbowlState.roundInfo.currentTeam].name;
    const cardsLeft = fishbowlState.roundInfo.cardsLeft;
    const timeLeft = fishbowlState.roundInfo.time;
    const currentCardName = fishbowlState.cards[fishbowlState.roundInfo.cards[fishbowlState.roundInfo.cardIndex]].name;
    const onGotIt = useCallback(() => {
        controller.current.gotIt();
        setFishbowlState({...controller.current});
    });

    const onPass = useCallback(() => {
        controller.current.pass();
        setFishbowlState({...controller.current});
    });

    const onUndo = useCallback(() => {
        controller.current.undo();
        setFishbowlState({...controller.current});
    });

    useEffect(() => {
        const interval = setInterval(() => {
            controller.current.tick();
            setFishbowlState({...controller.current});
        }, 1000);
        return () => clearInterval(interval);
    });

    return (
        <div>
            <div>
                <div>{currentTeamName}</div>
                <div>
                    <div>Cards Left</div>
                    <div>{cardsLeft}</div>
                </div>
                <div>
                    <div>Time Left</div>
                    <div>{timeLeft}</div>
                </div>
            </div>
            <span>{currentCardName}</span>
            <button onClick={onGotIt}>Got It</button>
            <button onClick={onPass}>Pass</button>
            <button onClick={onUndo}>Undo</button>
        </div>
    );
}

function FishbowlReady({controller, fishbowlState, setFishbowlState}) {
    let buttonText = `${controller.current.teams[controller.current.roundInfo.currentTeam].name} start`;
    let sortedTeams = [...controller.current.teams].sort((a, b) => {
        return b.points - a.points;
    });

    function onStartClick() {
        controller.current.startPlaying();
        setFishbowlState({...controller.current});
    }

    return (
        <div>
            <p>Ready?</p>
            <div>
            {sortedTeams.map((team) => {
                return (<div>
                    <span>{team.name}</span>
                    <span> {team.points}pts</span>
                </div>);
            })}
            </div>
            <div>
                <div>
                    {`Round ${fishbowlState.roundInfo.roundNumber + 1}`}
                </div>
                <div>
                    {`${fishbowlState.roundInfo.time} seconds left on the clock`}
                </div>
                <div>
                    {`${fishbowlState.roundInfo.cardsLeft} cards left`}
                </div>
            </div>
            <button onClick={onStartClick}>{buttonText}</button>
        </div>
    );
}

function FishbowlAddCards({controller, fishbowlState, setFishbowlState}) {
    const inputRef = useRef(null);
    const [inputHasText, setInputHasText] = useState(false);

    const clearInput = useCallback(() => {
        inputRef.current.value = "";
        setInputHasText(false);
    });

    const onAddCard = useCallback(() => {
        const inputText = inputRef.current.value;
        controller.current.addCard({
            name: inputText
        });
        setFishbowlState({...controller.current});
        clearInput();
    });

    const onRemoveCard = useCallback(() => {
        const inputText = inputRef.current.value;
        const cardFound = controller.current.removeCardByName(inputText);
        if (!cardFound) {
            alert("There is no card with that text, try again or....roll with it.");
        } else {
            setFishbowlState({...controller.current});
        }
        clearInput();
    });

    const onRemoveLastCard = useCallback(() => {
        const removedCard = controller.current.removeLastCard().name;
        alert(`Removed ${removedCard}`);
        setFishbowlState({...controller.current});
    });

    const onReady = useCallback(() => {
        controller.current.finalizeCards();
        setFishbowlState({...controller.current});
    });

    function checkIfInputHasText() {
        const inputText = inputRef.current.value;
        if (inputText && inputText !== "") {
            setInputHasText(true);
        } else {
            setInputHasText(false);
        }
    }

    return (
        <div>
            <p>{`Add ${fishbowlState.totalCards - fishbowlState.cards.length} more cards`}</p>
            <input onChange={checkIfInputHasText} ref={inputRef} type="text" placeholder="Card Text"></input>
            <button disabled={!inputHasText || fishbowlState.cards.length === fishbowlState.totalCards} onClick={onAddCard}>Add Card</button>
            <button disabled={!inputHasText} onClick={onRemoveCard}>Remove Card by Name</button>
            <button disabled={fishbowlState.cards.length === 0} onClick={onRemoveLastCard}>Remove Last Card</button>
            <button disabled={fishbowlState.cards.length !== fishbowlState.totalCards} onClick={onReady}>Ready</button>
        </div>
    );
}

function stringToInt(value) {
    return parseInt(value, 10);
}

function FishbowlSetup({controller, fishbowlState, setFishbowlState}) {
    const teamCountRef = useRef(null);
    const totalCardsRef = useRef(null);
    const timePerTurnRef = useRef(null);

    function onSubmit(event) {
        event.preventDefault();
        controller.current.setRules({
            teamCount: stringToInt(teamCountRef.current.value),
            totalCards: stringToInt(totalCardsRef.current.value),
            timePerTurn: stringToInt(timePerTurnRef.current.value)
        });
        setFishbowlState({...controller.current});
    }


    return (
        <div>
            <form onSubmit={onSubmit}>
            <div>
                <div>Team Count</div>
                <input required type="number" min={2} max={20} ref={teamCountRef}></input>
            </div>
            <div>
                <div>Total Cards</div>
                <input required pattern="[0-9]+" type="text" ref={totalCardsRef}></input>
            </div>
            <div>
                <div>Time Per Turn</div>
                <input required pattern="[0-9]+" type="text" ref={timePerTurnRef}></input>
            </div>
            <button>Submit</button>
            </form>
        </div>
    );
}

function FishbowlStage({controller, fishbowlState, setFishbowlState}) {
    switch(fishbowlState.stage) {
        case Stages.Setup: 
        return (<FishbowlSetup controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}/>);

        case Stages.AddCards:
        return (<FishbowlAddCards controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}/>);

        case Stages.Ready:
        return (<FishbowlReady controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}/>);

        case Stages.Play:
        return (<FishbowlPlay controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}/>);

        case Stages.Done:
        return (<FishbowlDone controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}/>);

        default:
        return null;
    }
}

export function Fishbowl() {
    const controller = useRef(new FishbowlController());
    const [fishbowlState, setFishbowlState] = useState({...controller.current});

    const onForceReset = useCallback(() => {
        if (window.confirm("Are you sure you want to reset the game?")) {
            controller.current.resetGame();
            setFishbowlState({...controller.current});
        }
    });

    return (
        <div>
        <div>
            <button onClick={onForceReset}>Force Reset</button> Juan's Fishbowl   
        </div>
        <FishbowlStage controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}></FishbowlStage>
        </div>
    )
}