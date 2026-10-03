// Server and synchronous simulation entry point: all actions are ready before a request.
import { installRareActions } from './rulesCore';
import { applyRareAction } from './rareActions';
installRareActions(applyRareAction);
export * from './rulesCore';
