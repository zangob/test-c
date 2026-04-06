import React from 'react';
import { Box, Text } from '../ink.js';
import { Select } from './CustomSelect/select.js';

export type ProviderOption = 'anthropic' | 'openrouter' | 'zai';

type Props = {
  onProviderSelect(provider: ProviderOption): void;
};

export function ProviderSelector({ onProviderSelect }: Props): React.ReactNode {
  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>Select your AI provider:</Text>
      <Box flexDirection="column" width={70} gap={1}>
        <Text dimColor wrap="wrap">
          Choose how you want to access Claude. You can change this later in
          settings.
        </Text>
        <Select
          options={[
            {
              label: (
                <Text>
                  Anthropic{' '}
                  <Text dimColor>
                    · Direct access with Claude subscription or API key
                  </Text>
                </Text>
              ),
              value: 'anthropic',
            },
            {
              label: (
                <Text>
                  OpenRouter{' '}
                  <Text dimColor>· Access via OpenRouter platform</Text>
                </Text>
              ),
              value: 'openrouter',
            },
            {
              label: (
                <Text>
                  Z.ai{' '}
                  <Text dimColor>· Access via Z.ai platform</Text>
                </Text>
              ),
              value: 'zai',
            },
          ]}
          onChange={(value: ProviderOption) => {
            onProviderSelect(value);
          }}
          onCancel={() => {}}
        />
      </Box>
    </Box>
  );
}
