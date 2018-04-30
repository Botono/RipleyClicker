import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import _ from 'lodash';

import CONSTANTS from './constants';

class Game extends Component {
    state = {
        currency: Big(0),
        perSecond: Big(0),
        perClick: Big(1),
        mainInterval: null,
        ticksSinceSave: 0,
        buildings: {
            Places: {
                count: 0,
                initialCost: Big(1),
                production: Big(1),
            },
            Couches: {
                count: 0,
                initialCost: Big(100),
                production: Big(10),
            },
        },
    };

    componentDidMount() {
        if (_.isNil(localStorage.getItem('RipleyClicker'))) {
            this.saveGame();
        }
        const saveData = this.convertSaveNumbers(JSON.parse(localStorage.getItem('RipleyClicker')));

        this.setState({
            ...saveData,
            mainInterval: window.setInterval(this.handleGameTick, CONSTANTS.INTERVAL),
        })
    }

    convertSaveNumbers = (saveObj) => {
        const saveData = saveObj;
        let buildingData;

        saveData.currency = Big(saveData.currency);
        saveData.perSecond = Big(saveData.perSecond);
        saveData.perClick = Big(saveData.perClick);
        buildingData = _.forIn(saveData.buildings, (value, key, object) => {
            object[key].initialCost = Big(object[key].initialCost);
            object[key].production = Big(object[key].production);
            return object;
        });
        saveData.buildings = buildingData;

        return saveData;
    }

    saveGame = () => {
        const TheState = this.state;
        localStorage.setItem('RipleyClicker', JSON.stringify(TheState));
    }

    handleGameTick = () => {
        const currencyPerSecondAdjusted = this.state.perSecond.times(CONSTANTS.INTERVAL / 1000);
        const TheState = this.state;

        if (this.state.perSecond.gte(Big(0))) {
            TheState.currency = TheState.currency.add(currencyPerSecondAdjusted);
        }

        if (TheState.ticksSinceSave >= 50) {
            TheState.ticksSinceSave = 0;
            this.saveGame();
        } else {
            TheState.ticksSinceSave += 1;
        }

        this.setState(prevState => {
            return {
                currency: TheState.currency,
                ticksSinceSave: TheState.ticksSinceSave,
            }
        });
    }

    handleManualClick = (e) => {
        this.setState(prevState => {
            return {
                currency: prevState.currency.add(this.state.perClick),
            };
        });
    }

    getPriceOfNextBuilding = (name) => {
        const buildingInfo = this.state.buildings[name];
        let cost = null;
        if (buildingInfo) {
            cost = buildingInfo.initialCost.times(Math.pow(CONSTANTS.BUILDING_COST_MULTIPLIER, buildingInfo.count));
        }
        return cost;
    }

    disableBuyButton = (name) => {
        const price = this.getPriceOfNextBuilding(name);
        return !this.state.currency.gte(price);
    }

    updateCPS = () => {

    }

    buyBuilding = (e, name) => {
        const allBuildings = this.state.buildings;
        const buildingCost = this.getPriceOfNextBuilding(name);

        if (!_.isNil(buildingCost) && this.state.currency.gte(buildingCost)) {
            allBuildings[name].count += 1;

            this.setState(prevState => {
                return {
                    currency: prevState.currency.minus(buildingCost),
                    perSecond: prevState.perSecond.add(allBuildings[name].production),
                    buildings: {
                        ...allBuildings,
                    },
                };
            });
        }
    }

    render() {
        const buildings = this.state.buildings;

        let buildingMarkup = [];
        CONSTANTS.BUILDING_TYPES.forEach(name => {
            buildingMarkup.push(
                <li>
                    {name} ({buildings[name].count})
                    <input
                        type="button"
                        onClick={(e) => this.buyBuilding(e, name)}
                        disabled={this.disableBuyButton(name)}
                        value={`Buy 1 for: ${this.getPriceOfNextBuilding(name)}`}
                    />
                </li>
            );
        });
        return (
            <div>
                <p>
                    Currency: {this.state.currency.toString()}
                </p>
                <p>
                    Per Second: {this.state.perSecond.toString()}
                </p>
                <p>
                    Per Click: {this.state.perClick.toString()}
                </p>
                <p>
                    <input
                        type="button"
                        onClick={this.handleManualClick}
                        value="CLICK ME"
                    />
                </p>
                <p>
                    Buildings:
                </p>
                <ul>
                    {buildingMarkup}
                </ul>
            </div>
        );
    }
}

Game.propTypes = {

};

export default Game;