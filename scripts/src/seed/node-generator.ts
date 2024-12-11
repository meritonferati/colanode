import {
  Block,
  generateId,
  IdType,
  LocalTransaction,
  NodeAttributes,
  NodeRole,
  registry,
  generateNodeIndex,
  ViewAttributes,
  FieldAttributes,
  SelectOptionAttributes,
  DatabaseAttributes,
  FieldValue,
  ViewFilterAttributes,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';
import { faker } from '@faker-js/faker';

import { User } from './types';

const MESSAGES_PER_CONVERSATION = 1000;
const RECORDS_PER_DATABASE = 5000;

export class NodeGenerator {
  constructor(
    private readonly workspaceId: string,
    private readonly users: User[]
  ) {}

  public generate() {
    this.buildGeneralSpace();
    this.buildProductSpace();
    this.buildBusinessSpace();
    this.buildChats();
  }

  private buildGeneralSpace() {
    const spaceId = this.buildSpace(
      'General',
      'The general space',
      '01je8kh1yekmqd9643naenqf1rem'
    );
    this.buildPage('Welcome', spaceId, '01je8kh2018tqrrxqsc6af71zfem');
    this.buildPage('Resources', spaceId, '01je8kh202et2bagv8phg219cbem');
    this.buildPage('Guide', spaceId, '01je8kh202et2bagv8phg219cdem');
    this.buildChannel('Announcements', spaceId, '01je8kh1zvyrbp8fgt59t2cy8pem');
  }

  private buildProductSpace() {
    const spaceId = this.buildSpace(
      'Product',
      'The product space',
      '01je8kh20sp99fzn32cf9mf3pyem'
    );
    this.buildChannel('Discussions', spaceId, '01je8kh1j5m7v8bk06ara5txq5em');
    this.buildChannel('Alerts', spaceId, '01je8kh1yv79yfr5dsvy19g696em');
    this.buildPage('Roadmap', spaceId, '01je8kh1yyqmcxbdf67bgsc0wqem');
    this.buildTasksDatabase(spaceId);
  }

  private buildBusinessSpace() {
    const spaceId = this.buildSpace(
      'Business',
      'The business space',
      '01je8kh2055hxb5k4g0sr5vj6gem'
    );
    this.buildPage('Notes', spaceId, '01je8kh2055hxb5k4g0sr5vj6aem');
    this.buildClientsDatabase(spaceId);
    this.buildMeetingsDatabase(spaceId);
  }

  private buildChats() {
    for (let i = 1; i < this.users.length; i++) {
      const user = this.users[i]!;
      this.buildChat(user);
    }
  }

  private buildSpace(name: string, description: string, avatar: string) {
    const spaceId = generateId(IdType.Space);
    const collaborators: Record<string, NodeRole> = {};
    for (const user of this.users) {
      collaborators[user.userId] = 'admin';
    }

    const spaceAttributes: NodeAttributes = {
      type: 'space',
      name,
      description,
      parentId: this.workspaceId,
      collaborators,
      avatar,
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      spaceId,
      user.userId,
      spaceAttributes
    );

    user.transactions.push(createTransaction);
    return spaceId;
  }

  private buildChannel(name: string, spaceId: string, avatar: string) {
    const channelId = generateId(IdType.Channel);
    const channelAttributes: NodeAttributes = {
      type: 'channel',
      name,
      parentId: spaceId,
      avatar,
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      channelId,
      user.userId,
      channelAttributes
    );

    user.transactions.push(createTransaction);

    this.buidMessages(channelId, MESSAGES_PER_CONVERSATION, this.users);
  }

  private buildChat(user: User) {
    const mainUser = this.getMainUser();
    const chatId = generateId(IdType.Chat);
    const chatAttributes: NodeAttributes = {
      type: 'chat',
      parentId: this.workspaceId,
      collaborators: {
        [mainUser.userId]: 'admin',
        [user.userId]: 'admin',
      },
    };

    const createTransaction = this.buildCreateTransaction(
      chatId,
      mainUser.userId,
      chatAttributes
    );

    mainUser.transactions.push(createTransaction);

    this.buidMessages(chatId, MESSAGES_PER_CONVERSATION, [mainUser, user]);
  }

  private buildPage(name: string, parentId: string, avatar: string) {
    const pageId = generateId(IdType.Page);
    const pageAttributes: NodeAttributes = {
      type: 'page',
      name,
      parentId,
      content: this.buildDocumentContent(pageId),
      avatar,
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      pageId,
      user.userId,
      pageAttributes
    );

    user.transactions.push(createTransaction);
  }

  private buidMessages(conversationId: string, count: number, users: User[]) {
    for (let i = 0; i < count; i++) {
      this.buildMessage(conversationId, users);
    }
  }

  private buildMessage(conversationId: string, users: User[]) {
    const messageId = generateId(IdType.Message);

    const messageAttributes: NodeAttributes = {
      type: 'message',
      content: this.buildMessageContent(messageId),
      parentId: conversationId,
      subtype: 'standard',
      reactions: {},
    };

    const user = this.getRandomUser(users);
    const createTransaction = this.buildCreateTransaction(
      messageId,
      user.userId,
      messageAttributes
    );

    user.transactions.push(createTransaction);
  }

  private buildTasksDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const newStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'New',
      color: 'gray',
      index: generateNodeIndex(),
    };

    const activeStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Active',
      color: 'blue',
      index: generateNodeIndex(newStatusOption.index),
    };

    const toTestStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'To Test',
      color: 'yellow',
      index: generateNodeIndex(activeStatusOption.index),
    };

    const closedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Closed',
      color: 'red',
      index: generateNodeIndex(toTestStatusOption.index),
    };

    const statusField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'select',
      name: 'Status',
      index: generateNodeIndex(),
      options: {
        [newStatusOption.id]: newStatusOption,
        [activeStatusOption.id]: activeStatusOption,
        [toTestStatusOption.id]: toTestStatusOption,
        [closedStatusOption.id]: closedStatusOption,
      },
    };

    const apiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'api',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const devopsTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'devops',
      color: 'green',
      index: generateNodeIndex(apiTeamSelectOption.index),
    };

    const frontendTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'frontend',
      color: 'purple',
      index: generateNodeIndex(devopsTeamSelectOption.index),
    };

    const aiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'ai',
      color: 'pink',
      index: generateNodeIndex(frontendTeamSelectOption.index),
    };

    const otherTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(aiTeamSelectOption.index),
    };

    const teamsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multiSelect',
      name: 'Teams',
      index: generateNodeIndex(statusField.index),
      options: {
        [apiTeamSelectOption.id]: apiTeamSelectOption,
        [devopsTeamSelectOption.id]: devopsTeamSelectOption,
        [frontendTeamSelectOption.id]: frontendTeamSelectOption,
        [aiTeamSelectOption.id]: aiTeamSelectOption,
        [otherTeamSelectOption.id]: otherTeamSelectOption,
      },
    };

    const assignedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Assigned',
      index: generateNodeIndex(teamsField.index),
    };

    const priorityField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'number',
      name: 'Priority',
      index: generateNodeIndex(assignedField.index),
    };

    const approvedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'boolean',
      name: 'Approved',
      index: generateNodeIndex(priorityField.index),
    };

    const releaseDateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Release Date',
      index: generateNodeIndex(approvedField.index),
    };

    const commentsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'text',
      name: 'Comment',
      index: generateNodeIndex(releaseDateField.index),
    };

    const allTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'All Tasks',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const activeTasksFilter: ViewFilterAttributes = {
      id: generateId(IdType.ViewFilter),
      type: 'field',
      fieldId: statusField.id,
      value: [activeStatusOption.id],
      operator: 'is_in',
    };

    const activeTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'Active Tasks',
      avatar: null,
      fields: {},
      filters: {
        [activeTasksFilter.id]: activeTasksFilter,
      },
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const kanbanView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'board',
      name: 'Kanban',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: statusField.id,
      sorts: {},
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Tasks',
      avatar: '01je8kh202et2bagv8phg219chem',
      fields: {
        [statusField.id]: statusField,
        [teamsField.id]: teamsField,
        [assignedField.id]: assignedField,
        [priorityField.id]: priorityField,
        [approvedField.id]: approvedField,
        [releaseDateField.id]: releaseDateField,
        [commentsField.id]: commentsField,
      },
      views: {
        [allTasksView.id]: allTasksView,
        [activeTasksView.id]: activeTasksView,
        [kanbanView.id]: kanbanView,
      },
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      databaseId,
      user.userId,
      databaseAttributes
    );

    user.transactions.push(createTransaction);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildClientsDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const newLeadStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'New Lead',
      color: 'gray',
      index: generateNodeIndex(),
    };

    const contactedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Contacted',
      color: 'blue',
      index: generateNodeIndex(newLeadStatusOption.index),
    };

    const qualifiedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Qualified',
      color: 'yellow',
      index: generateNodeIndex(contactedStatusOption.index),
    };

    const proposalSentStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Proposal Sent',
      color: 'red',
      index: generateNodeIndex(qualifiedStatusOption.index),
    };

    const negotiatingStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Negotiating',
      color: 'orange',
      index: generateNodeIndex(proposalSentStatusOption.index),
    };

    const convertedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Converted',
      color: 'green',
      index: generateNodeIndex(negotiatingStatusOption.index),
    };

    const statusField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'select',
      name: 'Status',
      index: generateNodeIndex(),
      options: {
        [newLeadStatusOption.id]: newLeadStatusOption,
        [contactedStatusOption.id]: contactedStatusOption,
        [qualifiedStatusOption.id]: qualifiedStatusOption,
        [proposalSentStatusOption.id]: proposalSentStatusOption,
        [negotiatingStatusOption.id]: negotiatingStatusOption,
        [convertedStatusOption.id]: convertedStatusOption,
      },
    };

    const techSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Tech',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const financeSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Finance',
      color: 'green',
      index: generateNodeIndex(techSectorSelectOption.index),
    };

    const marketingSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Marketing',
      color: 'purple',
      index: generateNodeIndex(financeSectorSelectOption.index),
    };

    const salesSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Sales',
      color: 'pink',
      index: generateNodeIndex(marketingSectorSelectOption.index),
    };

    const educationSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Education',
      color: 'purple',
      index: generateNodeIndex(salesSectorSelectOption.index),
    };

    const nonprofitSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Nonprofit',
      color: 'gray',
      index: generateNodeIndex(educationSectorSelectOption.index),
    };

    const otherSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(nonprofitSectorSelectOption.index),
    };

    const sectorField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multiSelect',
      name: 'Sector',
      index: generateNodeIndex(statusField.index),
      options: {
        [techSectorSelectOption.id]: techSectorSelectOption,
        [financeSectorSelectOption.id]: financeSectorSelectOption,
        [marketingSectorSelectOption.id]: marketingSectorSelectOption,
        [salesSectorSelectOption.id]: salesSectorSelectOption,
        [educationSectorSelectOption.id]: educationSectorSelectOption,
        [nonprofitSectorSelectOption.id]: nonprofitSectorSelectOption,
        [otherSectorSelectOption.id]: otherSectorSelectOption,
      },
    };

    const assignedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Assigned',
      index: generateNodeIndex(sectorField.index),
    };

    const revenueField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'number',
      name: 'Revenue',
      index: generateNodeIndex(assignedField.index),
    };

    const archivedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'boolean',
      name: 'Archived',
      index: generateNodeIndex(revenueField.index),
    };

    const startDateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Start Date',
      index: generateNodeIndex(archivedField.index),
    };

    const commentsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'text',
      name: 'Comment',
      index: generateNodeIndex(startDateField.index),
    };

    const allTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'All Clients',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const activeTasksFilter: ViewFilterAttributes = {
      id: generateId(IdType.ViewFilter),
      type: 'field',
      fieldId: statusField.id,
      value: [newLeadStatusOption.id],
      operator: 'is_in',
    };

    const activeTasksView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'Active Clients',
      avatar: null,
      fields: {},
      filters: {
        [activeTasksFilter.id]: activeTasksFilter,
      },
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const kanbanView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'board',
      name: 'Board',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: statusField.id,
      sorts: {},
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Clients',
      avatar: '01je8kh1zbbrb0mc3zrtrmz9dwem',
      fields: {
        [statusField.id]: statusField,
        [sectorField.id]: sectorField,
        [assignedField.id]: assignedField,
        [revenueField.id]: revenueField,
        [archivedField.id]: archivedField,
        [startDateField.id]: startDateField,
        [commentsField.id]: commentsField,
      },
      views: {
        [allTasksView.id]: allTasksView,
        [activeTasksView.id]: activeTasksView,
        [kanbanView.id]: kanbanView,
      },
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      databaseId,
      user.userId,
      databaseAttributes
    );

    user.transactions.push(createTransaction);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildMeetingsDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const techTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'tech',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const productTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'product',
      color: 'green',
      index: generateNodeIndex(techTagSelectOption.index),
    };

    const designTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'design (ui/ux)',
      color: 'purple',
      index: generateNodeIndex(productTagSelectOption.index),
    };

    const clientTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'client',
      color: 'pink',
      index: generateNodeIndex(designTagSelectOption.index),
    };

    const hiringSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'hiring',
      color: 'purple',
      index: generateNodeIndex(clientTagSelectOption.index),
    };

    const otherSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(hiringSectorSelectOption.index),
    };

    const tagsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multiSelect',
      name: 'Tags',
      index: generateNodeIndex(),
      options: {
        [techTagSelectOption.id]: techTagSelectOption,
        [productTagSelectOption.id]: productTagSelectOption,
        [designTagSelectOption.id]: designTagSelectOption,
        [clientTagSelectOption.id]: clientTagSelectOption,
        [hiringSectorSelectOption.id]: hiringSectorSelectOption,
        [otherSectorSelectOption.id]: otherSectorSelectOption,
      },
    };

    const attendeesField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Attendees',
      index: generateNodeIndex(tagsField.index),
    };

    const dateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Date',
      index: generateNodeIndex(attendeesField.index),
    };

    const calendarView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'calendar',
      name: 'Calendar',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(),
      nameWidth: null,
      groupBy: dateField.id,
      sorts: {},
    };

    const tableView: ViewAttributes = {
      id: generateId(IdType.View),
      type: 'table',
      name: 'Table',
      avatar: null,
      fields: {},
      filters: {},
      index: generateNodeIndex(calendarView.index),
      nameWidth: null,
      groupBy: null,
      sorts: {},
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Meetings',
      avatar: '01je8kh206r0bn9mrvsmhrrxzkem',
      fields: {
        [tagsField.id]: tagsField,
        [attendeesField.id]: attendeesField,
        [dateField.id]: dateField,
      },
      views: {
        [calendarView.id]: calendarView,
        [tableView.id]: tableView,
      },
    };

    const user = this.getMainUser();
    const createTransaction = this.buildCreateTransaction(
      databaseId,
      user.userId,
      databaseAttributes
    );

    user.transactions.push(createTransaction);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildRecords(
    databaseId: string,
    databaseAttributes: DatabaseAttributes,
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      this.buildRecord(databaseId, databaseAttributes);
    }
  }

  private buildRecord(
    databaseId: string,
    databaseAttributes: DatabaseAttributes
  ) {
    const recordId = generateId(IdType.Record);
    const recordAttributes: NodeAttributes = {
      type: 'record',
      parentId: databaseId,
      databaseId,
      content: this.buildDocumentContent(recordId),
      name: faker.lorem.sentence(),
      avatar: null,
      fields: {},
    };

    for (const field of Object.values(databaseAttributes.fields)) {
      const fieldValue = this.buildFieldValue(field);
      if (fieldValue) {
        recordAttributes.fields[field.id] = fieldValue;
      }
    }

    const user = this.getRandomUser(this.users);
    const createTransaction = this.buildCreateTransaction(
      recordId,
      user.userId,
      recordAttributes
    );

    user.transactions.push(createTransaction);
  }

  private getRandomUser(users: User[]): User {
    const user = users[Math.floor(Math.random() * users.length)];
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private getMainUser(): User {
    return this.users[0]!;
  }

  private buildCreateTransaction(
    id: string,
    userId: string,
    attributes: NodeAttributes
  ): LocalTransaction {
    const ydoc = new YDoc();
    const model = registry.getModel(attributes.type);

    const update = ydoc.updateAttributes(model.schema, attributes);

    return {
      id: generateId(IdType.Transaction),
      operation: 'create',
      data: encodeState(update),
      nodeId: id,
      nodeType: attributes.type,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
  }

  private buildMessageContent(messageId: string): Record<string, Block> {
    const paragraphBlock = this.buildParagraphBlock(
      messageId,
      generateNodeIndex()
    );
    return {
      [paragraphBlock.id]: paragraphBlock,
    };
  }

  private buildDocumentContent(pageId: string): Record<string, Block> {
    const nrOfParagraphs = Math.floor(Math.random() * 10) + 1;
    const blocks: Record<string, Block> = {};
    for (let i = 0; i < nrOfParagraphs; i++) {
      const block = this.buildParagraphBlock(pageId, generateNodeIndex());
      blocks[block.id] = block;
    }

    return blocks;
  }

  private buildParagraphBlock(parentId: string, index: string): Block {
    const blockId = generateId(IdType.Block);
    return {
      type: 'paragraph',
      parentId,
      content: [{ type: 'text', text: faker.lorem.sentence(), marks: null }],
      id: blockId,
      index,
      attrs: null,
    };
  }

  private buildFieldValue(field: FieldAttributes): FieldValue | null {
    if (field.type === 'boolean') {
      return {
        type: 'boolean',
        value: faker.datatype.boolean(),
      };
    } else if (field.type === 'collaborator') {
      return {
        type: 'collaborator',
        value: [this.getRandomUser(this.users).userId],
      };
    } else if (field.type === 'date') {
      return {
        type: 'date',
        value: faker.date.recent().toISOString(),
      };
    } else if (field.type === 'email') {
      return {
        type: 'email',
        value: faker.internet.email(),
      };
    } else if (field.type === 'multiSelect') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'multiSelect',
        value: [randomOption.id],
      };
    } else if (field.type === 'number') {
      return {
        type: 'number',
        value: Math.floor(Math.random() * 1000),
      };
    } else if (field.type === 'phone') {
      return {
        type: 'phone',
        value: faker.phone.number(),
      };
    } else if (field.type === 'select') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'select',
        value: randomOption.id,
      };
    } else if (field.type === 'text') {
      return {
        type: 'text',
        value: faker.lorem.sentence(),
      };
    } else if (field.type === 'url') {
      return {
        type: 'url',
        value: faker.internet.url(),
      };
    }

    return null;
  }
}
