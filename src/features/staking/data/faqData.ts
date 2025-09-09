import type { FAQItem } from '@/components/FAQ'

export const stakingFAQData: Array<FAQItem> = [
  {
    id: 'benefits',
    question: 'What are the benefits of staking?',
    answer:
      'Staking SEAM tokens allows you to earn protocol rewards while participating in governance. You receive a share of protocol fees and additional incentives based on your staking duration and amount.',
  },
  {
    id: 'fees',
    question: 'By staking, how much protocol fees/rewards can I expect?',
    answer:
      'Protocol rewards vary based on total staked amount, protocol performance, and your stake duration. Current APR ranges from 5-35% depending on the reward source.',
  },
  {
    id: 'claiming',
    question: 'How often can I claim staking rewards?',
    answer:
      'Rewards can be claimed at any time. However, note that SEAM can only be unstaked after the 7-day cooldown period expires.',
  },
  {
    id: 'unstaking',
    question: 'How do I unstake SEAM?',
    answer:
      'To unstake SEAM, initiate the unstaking process which triggers a 7-day cooldown period. After the cooldown expires, you can complete the unstaking to receive your SEAM tokens.',
  },
  {
    id: 'cooldown',
    question: 'What happens after the 7-day cooldown expires?',
    answer:
      "After the 7-day cooldown period, you have a window to complete your unstaking. If you don't unstake during this window, you'll need to restart the cooldown process.",
  },
  {
    id: 'earning-during-cooldown',
    question: 'Do I continue to earn staking rewards during the unstake cooldown period?',
    answer:
      'Yes, you continue to earn staking rewards during the cooldown period until you complete the unstaking process.',
  },
  {
    id: 'cooldown-purpose',
    question: 'Why is there a cooldown period and unstaking windows?',
    answer:
      'The cooldown period helps maintain protocol stability and prevents rapid exits that could impact the staking ecosystem. It also ensures fair reward distribution.',
  },
  {
    id: 'slashing',
    question: 'What does it mean to be "slashed"?',
    answer:
      'Slashing is a penalty mechanism where a portion of staked tokens can be reduced if the protocol experiences certain adverse events. This helps align staker incentives with protocol health.',
  },
  {
    id: 'learn-more',
    question: 'Where can I learn more?',
    answer:
      'Visit our documentation, Discord community, or governance forum for detailed information about staking mechanics, rewards, and protocol updates.',
  },
]
