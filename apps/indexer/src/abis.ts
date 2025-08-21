import { Interface } from 'fuels';
import vaultAbi from '../abi/vault-abi.json';

export const logIdsByName: Record<string, string> = {};

// TODO: Add all relevant interfaces for abis
export const vaultInterface = new Interface(vaultAbi);

const concreteTypes = [...vaultAbi.concreteTypes];

const attachInterface = (types: { logId: string, concreteTypeId: string }[], iface: Interface) => types.map(type => ({
    ...type,
    iface,
    name: concreteTypes.find((t) => t.concreteTypeId === type.concreteTypeId)!.type,
}))

const loggedTypes = [
    ...attachInterface(vaultAbi.loggedTypes, vaultInterface),
]

for (const type of loggedTypes) {
    const concreteType = concreteTypes.find((t) => t.concreteTypeId === type.concreteTypeId);
    if (concreteType) {
        console.log(type.name, type.logId, concreteType.type);
        logIdsByName[concreteType.type] = type.logId;
    }
}

export function decodeLog<T = { name: string, data: any }>(id: string, data: string, tx: string): T | null {
    for (const type of loggedTypes) {
        if (type.logId === id) {
            try {
                const [log] = type.iface.decodeLog(data, type.logId);
                return { name: type.name, data: log } as T;
            } catch (e) {
                console.error('Failed to decode log', type.name, type.logId, tx, e);
                return null;
            }
        }
    }
    return null
}

console.log(logIdsByName);
