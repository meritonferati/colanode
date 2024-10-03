export type SelectOptionCreateMutationInput = {
  type: 'select_option_create';
  userId: string;
  fieldId: string;
  name: string;
  color: string;
};

export type SelectOptionCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    select_option_create: {
      input: SelectOptionCreateMutationInput;
      output: SelectOptionCreateMutationOutput;
    };
  }
}
