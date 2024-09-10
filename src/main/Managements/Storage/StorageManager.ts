import lodash from 'lodash';
import _ from 'lodash';

import {ChosenArgumentsData} from '../../../cross/CrossTypes';
import {
  CustomRunBehaviorData,
  HomeCategory,
  PreCommands,
  PreOpen,
  PreOpenData,
  RecentlyOperation,
  StorageOperation,
  storageUtilsChannels,
} from '../../../cross/IpcChannelAndTypes';
import {InstalledCard, InstalledCards} from '../../../cross/StorageTypes';
import {appManager, cardsValidator, moduleManager} from '../../index';
import BaseStorage from './BaseStorage';

class StorageManager extends BaseStorage {
  //#region Constructor

  constructor() {
    super();
  }

  //#endregion

  //#region Private Methods

  private getPreCommands(id: string): string[] {
    return this.getData('cardsConfig').preCommands.find(preCommand => preCommand.cardId === id)?.data || [];
  }

  private getCustomRun(id: string): string[] {
    return this.getData('cardsConfig').customRun.find(customRun => customRun.cardId === id)?.data || [];
  }

  private getPreOpen(id: string): PreOpenData {
    return this.getData('cardsConfig').preOpen.find(preOpen => preOpen.cardId === id)?.data || [];
  }

  private getArgs(cardId: string) {
    return this.getData('cardsConfig').args.find(arg => arg.cardId === cardId);
  }

  private setArgs(cardId: string, args: ChosenArgumentsData) {
    const currentArgs = this.getData('cardsConfig').args;
    const existingArgIndex = currentArgs.findIndex(arg => arg.cardId === cardId);

    if (existingArgIndex !== -1) {
      currentArgs[existingArgIndex] = {cardId, ...args};
    } else {
      currentArgs.push({cardId, ...args});
    }

    this.updateData('cardsConfig', {args: currentArgs});
  }

  //#endregion

  //#region Getter

  public getPreOpenById(cardId: string) {
    return this.getData('cardsConfig').preOpen.find(preOpen => preOpen.cardId === cardId);
  }

  public getPreCommandById(cardId: string) {
    return this.getData('cardsConfig').preCommands.find(preOpen => preOpen.cardId === cardId);
  }

  public getCustomRunById(cardId: string) {
    return this.getData('cardsConfig').customRun.find(preOpen => preOpen.cardId === cardId);
  }

  public async getCardArgumentsById(cardId: string) {
    const args = this.getArgs(cardId);
    if (args) return args;
    const dir = this.getData('cards').installedCards.find(card => card.id === cardId)?.dir;
    if (dir) {
      const returnArgs = await moduleManager.getMethodsById(cardId)?.readArgs?.(dir);
      const result: ChosenArgumentsData = {
        activePreset: 'Default',
        data: [{preset: 'Default', arguments: returnArgs || []}],
      };
      this.setArgs(cardId, result);
      return result;
    }
    throw new Error('Something went wrong when getting arguments data!');
  }

  public async setCardArguments(cardId: string, args: ChosenArgumentsData) {
    this.setArgs(cardId, args);
    const dir = this.getData('cards').installedCards.find(card => card.id === cardId)?.dir;
    if (dir) {
      const result = args.data.find(arg => arg.preset === args.activePreset)?.arguments || [];
      await moduleManager.getMethodsById(cardId)?.saveArgs?.(dir, result);
    }
  }

  //#endregion

  //#region Public Methods

  //#region Installed Cards

  public addInstalledCard(card: InstalledCard) {
    const storedCards = this.getData('cards').installedCards;

    const cardExists = storedCards.some(c => c.id === card.id);

    if (!cardExists) {
      const result: InstalledCards = [...storedCards, card];

      this.updateData('cards', {installedCards: result});

      appManager.getWebContent()?.send(storageUtilsChannels.onInstalledCards, result);
    }
    cardsValidator.changedCards();
  }

  public removeInstalledCard(id: string) {
    const storedCards = this.getData('cards').installedCards;

    const updatedCards = storedCards.filter(card => card.id !== id);

    this.updateData('cards', {installedCards: updatedCards});

    appManager.getWebContent()?.send(storageUtilsChannels.onInstalledCards, updatedCards);
    cardsValidator.changedCards();
  }

  public removeInstalledCardByPath(dir: string) {
    this.updateData('cards', {installedCards: this.getData('cards').installedCards.filter(card => card.dir !== dir)});
    appManager.getWebContent()?.send(storageUtilsChannels.onInstalledCards, this.getData('cards').installedCards);
  }

  //#endregion

  //#region Auto Update Cards

  public addAutoUpdateCard(cardId: string) {
    const storedAutoUpdateCards = this.getData('cards').autoUpdateCards;

    const cardExists = lodash.includes(storedAutoUpdateCards, cardId);

    if (!cardExists) {
      const result: string[] = [...storedAutoUpdateCards, cardId];

      this.updateData('cards', {autoUpdateCards: [...storedAutoUpdateCards, cardId]});

      appManager.getWebContent()?.send(storageUtilsChannels.onAutoUpdateCards, result);
    }
  }

  public removeAutoUpdateCard(cardId: string) {
    const storedAutoUpdateCards = this.getData('cards').autoUpdateCards;

    const updatedAutoUpdateCards = lodash.filter(storedAutoUpdateCards, id => id !== cardId);

    this.updateData('cards', {autoUpdateCards: updatedAutoUpdateCards});

    appManager.getWebContent()?.send(storageUtilsChannels.onAutoUpdateCards, updatedAutoUpdateCards);
  }

  //#endregion

  //#region Auto Update Extensions

  public addAutoUpdateExtensions(cardId: string) {
    const storedAutoUpdateExtensions = this.getData('cards').autoUpdateExtensions;

    const extensionsExists = lodash.includes(storedAutoUpdateExtensions, cardId);

    console.log('extensionsExists', extensionsExists);
    if (!extensionsExists) {
      const result: string[] = [...storedAutoUpdateExtensions, cardId];

      console.log('extensionsExists', [...storedAutoUpdateExtensions, cardId]);
      this.updateData('cards', {autoUpdateExtensions: [...storedAutoUpdateExtensions, cardId]});

      appManager.getWebContent()?.send(storageUtilsChannels.onAutoUpdateExtensions, result);
    }
  }

  public removeAutoUpdateExtensions(cardId: string) {
    const storedAutoUpdateExtensions = this.getData('cards').autoUpdateExtensions;

    const updatedAutoUpdateExtensions = lodash.filter(storedAutoUpdateExtensions, id => id !== cardId);

    this.updateData('cards', {autoUpdateExtensions: updatedAutoUpdateExtensions});

    appManager.getWebContent()?.send(storageUtilsChannels.onAutoUpdateExtensions, updatedAutoUpdateExtensions);
  }

  //#endregion

  //#region Pinned Cards

  public addPinnedCard(cardId: string) {
    const storedPinnedCards = this.getData('cards').pinnedCards;

    const cardExists = lodash.includes(storedPinnedCards, cardId);

    if (!cardExists) {
      const result: string[] = [...storedPinnedCards, cardId];

      this.updateData('cards', {pinnedCards: [...storedPinnedCards, cardId]});

      appManager.getWebContent()?.send(storageUtilsChannels.onPinnedCardsChange, result);
    }
  }

  public removePinnedCard(cardId: string) {
    const storedPinnedCards = this.getData('cards').pinnedCards;

    const updatedPinnedCards = lodash.filter(storedPinnedCards, id => id !== cardId);

    this.updateData('cards', {pinnedCards: updatedPinnedCards});

    appManager.getWebContent()?.send(storageUtilsChannels.onPinnedCardsChange, updatedPinnedCards);
  }

  public pinnedCardsOpt(opt: StorageOperation, id: string) {
    let result: string[] = [];

    switch (opt) {
      case 'add':
        this.addPinnedCard(id);
        break;

      case 'remove':
        this.removePinnedCard(id);
        break;

      case 'get':
        result = this.getData('cards').pinnedCards;
        break;
    }

    return result;
  }

  //#endregion

  //#region Recently Used Cards

  public updateRecentlyUsedCards(id: string) {
    const newArray = _.without(this.getData('cards').recentlyUsedCards, id);
    // Add the id to the beginning of the array
    newArray.unshift(id);
    // Keep only the last 5 elements
    const result = _.take(newArray, 5);

    this.updateData('cards', {recentlyUsedCards: result});

    appManager.getWebContent()?.send(storageUtilsChannels.onRecentlyUsedCardsChange, result);
  }

  public recentlyUsedCardsOpt(opt: RecentlyOperation, id: string) {
    let result: string[] = [];

    switch (opt) {
      case 'update':
        this.updateRecentlyUsedCards(id);
        break;

      case 'get':
        result = this.getData('cards').recentlyUsedCards;
        break;
    }

    return result;
  }

  //#endregion

  //#region Home Category

  public setHomeCategory(data: string[]) {
    this.updateData('app', {homeCategory: data});
    appManager.getWebContent()?.send(storageUtilsChannels.onHomeCategory, data);
  }

  public homeCategoryOpt(opt: StorageOperation, data: string[]) {
    let result: HomeCategory = [];

    switch (opt) {
      case 'set':
        this.setHomeCategory(data);
        break;

      case 'get':
        result = this.getData('app').homeCategory;
        break;
    }

    return result;
  }

  //#endregion

  //#region Pre Commands

  public addPreCommand(cardId: string, command: string): void {
    const preCommands = this.getData('cardsConfig').preCommands;
    const existCommand = preCommands.findIndex(command => command.cardId === cardId);

    let commands: string[];

    if (existCommand !== -1) {
      preCommands[existCommand].data.push(command);
      commands = preCommands[existCommand].data;
    } else {
      commands = [command];
      preCommands.push({cardId, data: [command]});
    }

    appManager.getWebContent()?.send(storageUtilsChannels.onPreCommands, {commands, id: cardId});

    this.updateData('cardsConfig', {preCommands});
  }

  public setPreCommand(cardId: string, commands: string[]): void {
    const preCommands = this.getData('cardsConfig').preCommands;
    const existCommand = preCommands.findIndex(command => command.cardId === cardId);

    if (existCommand !== -1) {
      preCommands[existCommand].data = commands;
    } else {
      preCommands.push({cardId, data: commands});
    }
    this.updateData('cardsConfig', {preCommands});
  }

  public removePreCommand(cardId: string, index: number): void {
    const preCommands = this.getData('cardsConfig').preCommands;
    const existCommand = preCommands.findIndex(command => command.cardId === cardId);

    let commands: string[] = [];

    if (existCommand !== -1) {
      preCommands[existCommand].data.splice(index, 1);
      commands = preCommands[existCommand].data;
    }

    appManager.getWebContent()?.send(storageUtilsChannels.onPreCommands, {commands, id: cardId});
    this.updateData('cardsConfig', {preCommands});
  }

  public preCommandOpt(opt: StorageOperation, data: PreCommands) {
    let result: string[] = [];

    switch (opt) {
      case 'add':
        if (typeof data.command === 'string') this.addPreCommand(data.id, data.command);
        break;

      case 'remove':
        if (typeof data.command === 'number') this.removePreCommand(data.id, data.command);
        break;

      case 'get':
        result = this.getPreCommands(data.id);
        break;

      case 'set':
        if (lodash.isArray(data.command)) this.setPreCommand(data.id, data.command);
        break;
    }

    return result;
  }

  //#endregion

  //#region Custom Run

  public addCustomRun(cardId: string, command: string): void {
    const customRun = this.getData('cardsConfig').customRun;
    const existCustomRun = customRun.findIndex(custom => custom.cardId === cardId);

    let custom: string[];

    if (existCustomRun !== -1) {
      customRun[existCustomRun].data.push(command);
      custom = customRun[existCustomRun].data;
    } else {
      custom = [command];
      customRun.push({cardId, data: [command]});
    }

    appManager.getWebContent()?.send(storageUtilsChannels.onCustomRun, {commands: custom, id: cardId});
    this.updateData('cardsConfig', {customRun});
  }

  public setCustomRun(cardId: string, commands: string[]): void {
    const customRun = this.getData('cardsConfig').customRun;
    const existCommand = customRun.findIndex(command => command.cardId === cardId);

    if (existCommand !== -1) {
      customRun[existCommand].data = commands;
    } else {
      customRun.push({cardId, data: commands});
    }
    this.updateData('cardsConfig', {customRun});
  }

  public removeCustomRun(cardId: string, index: number): void {
    const customRun = this.getData('cardsConfig').customRun;
    const existCommand = customRun.findIndex(command => command.cardId === cardId);

    let commands: string[] = [];

    if (existCommand !== -1) {
      customRun[existCommand].data.splice(index, 1);
      commands = customRun[existCommand].data;
    }

    appManager.getWebContent()?.send(storageUtilsChannels.onCustomRun, {commands, id: cardId});
    this.updateData('cardsConfig', {customRun});
  }

  public customRunOpt(opt: StorageOperation, data: PreCommands) {
    let result: string[] = [];

    switch (opt) {
      case 'add':
        if (typeof data.command === 'string') this.addCustomRun(data.id, data.command);
        break;

      case 'remove':
        if (typeof data.command === 'number') this.removeCustomRun(data.id, data.command);
        break;

      case 'get':
        result = this.getCustomRun(data.id);
        break;

      case 'set':
        if (lodash.isArray(data.command)) this.setCustomRun(data.id, data.command);
        break;
    }

    return result;
  }

  //#endregion

  //#region Pre Open

  public addPreOpen(cardId: string, open: {type: 'folder' | 'file'; path: string}): void {
    const preOpen = this.getData('cardsConfig').preOpen;
    const existCustomRun = preOpen.findIndex(custom => custom.cardId === cardId);

    if (existCustomRun !== -1) {
      preOpen[existCustomRun].data.push(open);
    } else {
      preOpen.push({cardId, data: [open]});
    }
    this.updateData('cardsConfig', {preOpen});
  }

  public removePreOpen(cardId: string, index: number): void {
    const preOpen = this.getData('cardsConfig').preOpen;
    const existCommand = preOpen.findIndex(command => command.cardId === cardId);

    if (existCommand !== -1) {
      preOpen[existCommand].data.splice(index, 1);
    }
    this.updateData('cardsConfig', {preOpen});
  }

  public preOpenOpt(opt: StorageOperation, data: PreOpen): PreOpenData {
    let result: PreOpenData = [];

    switch (opt) {
      case 'add':
        if (typeof data.open === 'object' && data.open) this.addPreOpen(data.id, data.open);
        break;

      case 'remove':
        if (typeof data.open === 'number') this.removePreOpen(data.id, data.open);
        break;

      case 'get':
        result = this.getPreOpen(data.id);
        break;
    }

    return result;
  }

  //#endregion

  public updateCustomRunBehavior(data: CustomRunBehaviorData) {
    let customRunBehavior = this.getData('cardsConfig').customRunBehavior;
    const existCustom = customRunBehavior.findIndex(command => command.cardID === data.cardID);

    if (existCustom !== -1) {
      console.info('exist');
      customRunBehavior[existCustom] = data;
    } else {
      console.info('not exist');
      customRunBehavior = [...customRunBehavior, data];
    }

    console.info('customRunBehavior', customRunBehavior);
    this.updateData('cardsConfig', {customRunBehavior});
  }

  //#endregion
}

export default StorageManager;
