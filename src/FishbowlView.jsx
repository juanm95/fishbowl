import { FishbowlController, Stages } from "./FishbowlController"
import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./FishbowlView.module.css";

function FishbowlDone({controller, fishbowlState, setFishbowlState}) {
    const sortedTeams = [...fishbowlState.teams].sort((a, b) => {
        return b.points - a.points;
    });
    const winningTeam = sortedTeams[0];
    const winningTeamName = winningTeam.name;
    const onChangeCards = useCallback(() => {
        controller.current.changeCards();
        setFishbowlState({...controller.current});
    });

    const onChangeRules = useCallback(() => {
        controller.current.resetGame();
        setFishbowlState({...controller.current});
    });

    return (
        <div className={styles.readyStage}>
            <div>
                <div>{winningTeamName} Won!</div>
            </div>
            <div className={styles.teamList}>
                {sortedTeams.map((team) => {
                    return (
                        <div className={styles.teamListItem}>
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
        let shouldTick = true;
        const visibilityChangeListener = () => {
            if (document.hidden) {
                shouldTick = false;
            } else {
                shouldTick = true;
            }
          };
        
        document.addEventListener("visibilitychange", visibilityChangeListener);
        const interval = setInterval(() => {
            if (!shouldTick) return;

            controller.current.tick();
            setFishbowlState({...controller.current});
        }, 1000);
        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", visibilityChangeListener);
        };
    });

    return (
        <div className={styles.playStage}>
            <div className={styles.roundStats}>
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
            <div className={styles.card}>{currentCardName}</div>
            <div className={styles.actions}>
                <div className={styles.undoSection}>
                    <button disabled={fishbowlState.roundInfo.lastAction == null} onClick={onUndo}>Undo</button>
                </div>
                <div className={styles.mainButtonSection}>
                    <button className={styles.gotIt} onClick={onGotIt}>Got It</button>
                    <button className={styles.pass} onClick={onPass}>Pass</button>
                </div>
            </div>
        </div>
    );
}

function FishbowlReady({controller, fishbowlState, setFishbowlState}) {
    let buttonText = `${controller.current.teams[controller.current.roundInfo.currentTeam].name} start`;
    let sortedTeams = [...controller.current.teams].sort((a, b) => {
        return b.points - a.points;
    });
    const [startButtonDisabled, setStartButtonDisabled] = useState(true);

    function onStartClick() {
        controller.current.startPlaying();
        setFishbowlState({...controller.current});
    }

    // Delay the start of the game by 1 seconds, to prevent accidental clicks
    useEffect(() => {
        const interval = setTimeout(() => {
            setStartButtonDisabled(false);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.readyStage}>
            Ready?
            <div className={styles.teamList}>
            {sortedTeams.map((team) => {
                return (
                    <div key={team.name} className={styles.teamListItem}>
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
            <button disabled={startButtonDisabled} onClick={onStartClick}>{buttonText}</button>
        </div>
    );
}

function FishbowlAddCards({controller, fishbowlState, setFishbowlState}) {
    const inputRef = useRef(null);
    const [inputHasText, setInputHasText] = useState(false);
    const readyRef = useRef(null);
    const readyButtonDisabled = fishbowlState.cards.length !== fishbowlState.totalCards;
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
        if (fishbowlState.cards.length < fishbowlState.totalCards) {
            inputRef.current.focus();
        }
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
        inputRef.current.focus();

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
        <div className={styles.addCardStage}>
            <div>{`Add ${fishbowlState.totalCards - fishbowlState.cards.length} more cards`}</div>
            <textarea rows={3} maxLength={80} onChange={checkIfInputHasText} ref={inputRef} type="textarea" placeholder="Card Text"></textarea>
            {readyButtonDisabled ? 
                <button disabled={!inputHasText || fishbowlState.cards.length === fishbowlState.totalCards} onClick={onAddCard}>Add Card</button> :
                <button ref={readyRef} autoFocus={true} onClick={onReady}>Ready</button>
            }
            <button disabled={!inputHasText} onClick={onRemoveCard}>Remove Card by Name</button>
            <button disabled={fishbowlState.cards.length === 0} onClick={onRemoveLastCard}>Remove Last Card</button>
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
    const switchTeamsAfterRoundRef = useRef(null);

    function onSubmit(event) {
        event.preventDefault();
        controller.current.setRules({
            teamCount: stringToInt(teamCountRef.current.value),
            totalCards: stringToInt(totalCardsRef.current.value),
            timePerTurn: stringToInt(timePerTurnRef.current.value),
            switchTeamsAfterRound: switchTeamsAfterRoundRef.current.checked
        });
        setFishbowlState({...controller.current});
    }


    return (
        <form onSubmit={onSubmit} className={styles.inputList}>
            <div className={styles.input}>
                <label>Team Count</label>
                <input required type="number" min={2} max={20} ref={teamCountRef}></input>
            </div>
            <div className={styles.input}>
                <label>Total Cards</label>
                <input required type="number" min={2} ref={totalCardsRef}></input>
            </div>
            <div className={styles.input}>
                <label>Seconds Per Turn</label>
                <input required type="number" min={2} ref={timePerTurnRef}></input>
            </div>
            <div className={styles.input}>
                <label>Team switches each round
                <span className={styles.inputSubtitle}>
                    Leaving this unchecked will roll over the team that finished the last round to the next round with their remaining time.
                </span>
                </label>
                <input type="checkbox" ref={switchTeamsAfterRoundRef}></input>
            </div>
            <button>Ready</button>
    </form>
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
        <div className={styles.app}>
            <div className={styles.header}>
                <button onClick={onForceReset}>Force Reset</button> <span>Juan's Fishbowl</span>   
            </div>
            <FishbowlStage controller={controller} fishbowlState={fishbowlState} setFishbowlState={setFishbowlState}></FishbowlStage>
        </div>
    )
}