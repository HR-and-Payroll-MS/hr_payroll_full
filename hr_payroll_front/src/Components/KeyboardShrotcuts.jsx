// src/components/KeyboardShortcuts.jsx
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import ROLE_SHORTCUTS from '../config/shorcuts';
import { getLocalData } from '../Hooks/useLocalStorage';

function KeyboardShortcuts() {
  const navigate = useNavigate();
    const role =getLocalData('role')||"Employee"
  const shortcuts = ROLE_SHORTCUTS[role] || [];

  shortcuts.forEach((shortcut) => {
    let keysWin = shortcut.keys.toLowerCase();
    let keysMac = shortcut.keys.toLowerCase();
    if (keysWin.includes('ctrl')) {
      keysMac = keysMac.replace('ctrl', 'cmd');
    } else if (keysWin.includes('cmd')) {
      keysMac = keysMac.replace('cmd', 'ctrl');
      keysWin = keysWin.replace('cmd', 'ctrl');
    }

    useHotkeys(keysWin, (event) => {
      event.preventDefault();
      navigate(shortcut.path);
    }, { preventDefault: true });

    if (shortcut.keys.match(/(ctrl|cmd)/i)) {
      useHotkeys(keysMac, (event) => {
        event.preventDefault();
        navigate(shortcut.path);
      }, { preventDefault: true });
    }
  });

  return null;
}

export default KeyboardShortcuts;