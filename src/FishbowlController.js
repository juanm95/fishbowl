import { loadState, saveState } from "./FishbowlData";
import { shuffleArray } from "./Utilities";

export const Stages = {
    Setup: 0,
    AddCards: 1,
    Ready: 2,
    Play: 3,
    Done: 4
}

export class FishbowlController {
    constructor() {
        const storedState = loadState();
        if (storedState) {
            Object.entries(storedState).forEach(([key, value]) => {
                this[key] = value;
            });
            if (this.stage === Stages.Play) {
                this.stage = Stages.Ready;
            }
        } else {
            this.resetGame();
        }
    }

    backupState() {
        const state = {
            stage: this.stage,
            teams: this.teams,
            totalCards: this.totalCards,
            cards: this.cards,
            timePerTurn: this.timePerTurn,
            roundInfo: this.roundInfo,
            totalRounds: this.totalRounds
        }
        saveState(state);
    }

    resetGame() {
        this.stage = Stages.Setup;
        this.teams = null;
        this.totalCards = null
        this.cards = [];
        this.timePerTurn = null;
        this.switchTeamsAfterRound = false;
        this.roundInfo = null;
        this.totalRounds = 3;
        this.backupState();
    }

    setRules(rules) {
        this.teams = new Array(rules.teamCount).fill(0).map((_, index) => {
            return {
                points: 0,
                name: `Team ${index + 1}`
            }
        });
        this.totalCards = rules.totalCards;
        this.timePerTurn = rules.timePerTurn;
        this.stage = Stages.AddCards
        this.switchTeamsAfterRound = rules.switchTeamsAfterRound;
    }

    getCurrentCard() {
        return this.cards[this.roundInfo.cards[this.roundInfo.cardIndex]];
    }

    addCard(card) {
        this.cards.push(card);
        this.backupState();
    }

    removeLastCard() {
        const poppedCard = this.cards.pop();
        this.backupState();
        return poppedCard;
    }

    removeCardByName(cardName) {
        const lower = cardName.toLowerCase();
        const cardIndex = this.cards.findIndex((value) => {
            if (lower === value.name.toLowerCase()) {
                return true;
            }

            return false;
        });

        if (cardIndex === -1) {
            return false;
        }

        this.cards.splice(cardIndex, 1);
        this.backupState();
        return true;
    }

    getCardOrder() {
        let orderArray = new Array(this.cards.length).fill(0).map((_, index) => index);
        shuffleArray(orderArray)
        return orderArray;
    }

    getCurrentTeamName() {
        return this.teams[this.roundInfo.currentTeam].name;
    }

    finalizeCards() {
        this.stage = Stages.Ready;
        this.roundInfo = {
            roundNumber: 0,
            time: this.timePerTurn,
            currentTeam: 0,
            cards: this.getCardOrder(),
            cardIndex: 0,
            completedCards: {},
            cardsLeft: this.totalCards,
        };
        this.backupState();
    }

    startPlaying() {
        this.stage = Stages.Play;
    }

    changeToNextTeam() {
        this.stage = Stages.Ready;
        this.roundInfo.time = this.timePerTurn;
        this.roundInfo.currentTeam = (this.roundInfo.currentTeam + 1) % this.teams.length;
        this.roundInfo.cards = this.getCardOrder();
        this.roundInfo.lastAction = null;
        this.setNextCardIndex();
        this.backupState();
    }

    finishRound() {
        this.roundInfo.roundNumber++;
        if (this.roundInfo.roundNumber === this.totalRounds) {
            this.stage = Stages.Done;
            this.backupState();
            return;
        }

        this.stage = Stages.Ready;
        this.roundInfo.cards = this.getCardOrder();
        this.roundInfo.completedCards = {};
        this.roundInfo.cardsLeft = this.totalCards;
        if (this.switchTeamsAfterRound) {
            this.changeToNextTeam();
        } else {
            this.setNextCardIndex();
            this.backupState();
        }
    }

    setNextCardIndex() {
        this.roundInfo.cardIndex = (this.roundInfo.cardIndex + 1) % this.totalCards;
        while (this.roundInfo.completedCards[this.roundInfo.cards[this.roundInfo.cardIndex]]) {
            this.roundInfo.cardIndex = (this.roundInfo.cardIndex + 1) % this.totalCards;
        }
    }

    tick() {
        this.roundInfo.time--;
        if (this.roundInfo.time === 0) {
            this.changeToNextTeam();
        } else if (this.roundInfo.time % 5 === 0) {
            this.backupState();
        }
    }

    gotIt() {
        this.roundInfo.cardsLeft--;
        this.roundInfo.completedCards[this.roundInfo.cards[this.roundInfo.cardIndex]] = true;
        this.teams[this.roundInfo.currentTeam].points++;
        this.roundInfo.lastAction = {
            type: "gotIt",
            cardIndex: this.roundInfo.cardIndex
        }
        if (this.roundInfo.cardsLeft === 0) {
            this.finishRound();
        } else {
            this.setNextCardIndex();
            this.backupState();
        }
    }

    pass() {
        this.roundInfo.lastAction = {
            type: "pass",
            cardIndex: this.roundInfo.cardIndex
        }
        this.setNextCardIndex();
    }

    undo() {
        this.roundInfo.cardIndex = this.roundInfo.lastAction.cardIndex;
        if (this.roundInfo.lastAction.type === "gotIt") {
            this.roundInfo.cardsLeft++;
            this.roundInfo.completedCards[this.roundInfo.cards[this.roundInfo.cardIndex]] = false;
            this.teams[this.roundInfo.currentTeam].points--;
            this.backupState();
        }
        this.roundInfo.lastAction = null;
    }

    changeCards() {
        this.stage = Stages.AddCards;
        this.cards = [];
        this.teams.forEach((team) => {
            team.points = 0;
        });
        this.backupState();
    }
}