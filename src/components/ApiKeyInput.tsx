import React, { useState } from 'react';
import { Box, Text } from '../ink.js';
import { useKeybinding } from '../keybindings/useKeybinding.js';
import TextInput from './TextInput.js';

type Props = {
  providerLabel: string;
  envVarName: string;
  onSubmit(apiKey: string): void;
  onSkip?(): void;
};

export function ApiKeyInput({
  providerLabel,
  envVarName,
  onSubmit,
  onSkip,
}: Props): React.ReactNode {
  const [apiKey, setApiKey] = useState('');
  const [cursorOffset, setCursorOffset] = useState(0);
  const [error, setError] = useState('');

  useKeybinding('confirm:yes', () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API key is required');
      return;
    }
    onSubmit(trimmed);
  }, {
    context: 'Confirmation',
    isActive: true,
  });

  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>Enter your {providerLabel} API key:</Text>
      <Box flexDirection="column" width={70} gap={1}>
        <Text dimColor>
          This will be stored in your settings as <Text bold>{envVarName}</Text>
        </Text>
        <Box>
          <Text>{'> '}</Text>
          <TextInput
            value={apiKey}
            onChange={value => {
              setApiKey(value);
              setError('');
            }}
            onSubmit={value => {
              const trimmed = value.trim();
              if (!trimmed) {
                setError('API key is required');
                return;
              }
              onSubmit(trimmed);
            }}
            cursorOffset={cursorOffset}
            onChangeCursorOffset={setCursorOffset}
            mask="*"
            columns={60}
          />
        </Box>
        {error ? <Text color="error">{error}</Text> : null}
        <Text dimColor>
          Press Enter to confirm
          {onSkip ? ' · Esc to skip' : ''}
        </Text>
      </Box>
    </Box>
  );
}
