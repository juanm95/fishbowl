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
        this.resetGame();
    }

    backupState() {

    }

    resetGame() {
        this.stage = Stages.Setup;
        this.teams = null;
        this.totalCards = null
        this.cards = [];
        this.timePerTurn = null;
        this.roundInfo = null;
        this.lastAction = null;
        this.totalRounds = 3;
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
    }

    getCurrentCard() {
        return this.cards[this.roundInfo.cards[this.roundInfo.cardIndex]];
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeLastCard() {
        return this.cards.pop();
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
    }

    startPlaying() {
        this.stage = Stages.Play;
    }

    changeToNextTeam() {
        this.stage = Stages.Ready;
        this.roundInfo.time = this.timePerTurn;
        this.roundInfo.currentTeam = (this.roundInfo.currentTeam + 1) % this.teams.length;
        this.roundInfo.cards = this.getCardOrder();
        this.setNextCardIndex();
    }

    finishRound() {
        this.roundInfo.roundNumber++;
        if (this.roundInfo.roundNumber === this.totalRounds) {
            this.stage = Stages.Done;
            return;
        }

        this.stage = Stages.Ready;
        this.roundInfo.cards = this.getCardOrder();
        this.roundInfo.completedCards = {};
        this.roundInfo.cardsLeft = this.totalCards;
        this.setNextCardIndex();
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
        }
    }

    gotIt() {
        this.roundInfo.cardsLeft--;
        this.roundInfo.completedCards[this.roundInfo.cards[this.roundInfo.cardIndex]] = true;
        this.teams[this.roundInfo.currentTeam].points++;
        this.lastAction = {
            type: "gotIt",
            index: this.cardIndex
        }
        if (this.roundInfo.cardsLeft === 0) {
            this.finishRound();
        } else {
            this.setNextCardIndex();
        }
    }

    pass() {
        this.lastAction = {
            type: "pass",
            index: this.cardIndex
        }
        this.setNextCardIndex();
    }

    undo() {
        this.roundInfo.cardIndex = this.lastAction.cardIndex;
        if (this.lastAction.type === "gotIt") {
            this.roundInfo.cardsLeft++;
            this.roundInfo.completedCards[this.roundInfo.cards[this.roundInfo.cardIndex]] = false;
        }
        this.lastAction = null;
    }

    changeCards() {
        this.stage = Stages.AddCards;
        this.cards = [];
        this.teams.forEach((team) => {
            team.points = 0;
        });
    }
}