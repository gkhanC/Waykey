const HotkeyManager = require('../src/HotkeyManager');
const Keys = require('../scripts/Keys');

describe('HotkeyManager String Parser', () => {
    let mockApi;
    let manager;

    beforeEach(() => {
        mockApi = {
            dashboard: { updateHotkeys: jest.fn(), sendLog: jest.fn() },
            log: jest.fn(),
            device: { emitKey: jest.fn() }
        };
        manager = new HotkeyManager(mockApi);
    });

    test('parses Super+T correctly', () => {
        const parsed = manager.parseTrigger('Super+T');
        expect(parsed).toEqual([Keys.KEY_LEFTMETA, Keys.KEY_T]);
    });

    test('parses Ctrl+Shift+Enter correctly', () => {
        const parsed = manager.parseTrigger('Ctrl+Shift+Enter');
        expect(parsed).toEqual([Keys.KEY_LEFTCTRL, Keys.KEY_LEFTSHIFT, Keys.KEY_ENTER]);
    });

    test('hotkey execution with global context works', () => {
        const cb = jest.fn();
        manager.bind('Ctrl+A').execute(cb);

        manager.handleKeyEvent(Keys.KEY_LEFTCTRL, 1, { class: 'kitty' });
        manager.handleKeyEvent(Keys.KEY_A, 1, { class: 'kitty' });

        expect(cb).toHaveBeenCalled();
    });

    test('hotkey execution with specific window context works', () => {
        const cb = jest.fn();
        manager.bind('Alt+Space').whenActive('firefox').execute(cb);

        // Won't trigger on kitty
        manager.handleKeyEvent(Keys.KEY_LEFTALT, 1, { class: 'kitty' });
        manager.handleKeyEvent(Keys.KEY_SPACE, 1, { class: 'kitty' });
        expect(cb).not.toHaveBeenCalled();

        manager.handleKeyEvent(Keys.KEY_LEFTALT, 0, { class: 'kitty' });
        manager.handleKeyEvent(Keys.KEY_SPACE, 0, { class: 'kitty' });

        // Trigger on firefox
        manager.handleKeyEvent(Keys.KEY_LEFTALT, 1, { class: 'firefox' });
        manager.handleKeyEvent(Keys.KEY_SPACE, 1, { class: 'firefox' });
        expect(cb).toHaveBeenCalled();
    });
});
