export const NodeTypes = {
  User: 'user',
  Space: 'space',
  Page: 'page',
  Channel: 'channel',
  Message: 'message',
  Paragraph: 'paragraph',
  Heading: 'heading',
  Blockquote: 'blockquote',
  BulletList: 'bulletList',
  CodeBlock: 'codeBlock',
  ListItem: 'listItem',
  OrderedList: 'orderedList',
  TaskList: 'taskList',
  TaskItem: 'taskItem',
  HorizontalRule: 'horizontalRule',
  Database: 'database',
  DatabaseReplica: 'database_replica',
  Record: 'record',
  Folder: 'folder',
  TableView: 'table_view',
  BoardView: 'board_view',
  CalendarView: 'calendar_view',
  Field: 'field',
  SelectOption: 'select_option',
};

export const LeafNodeTypes: string[] = [
  NodeTypes.Paragraph,
  NodeTypes.Heading,
  NodeTypes.HorizontalRule,
  NodeTypes.CodeBlock,
];

export const RootNodeTypes: string[] = [
  NodeTypes.Space,
  NodeTypes.Message,
  NodeTypes.Page,
  NodeTypes.Channel,
];

export const ViewNodeTypes: string[] = [
  NodeTypes.TableView,
  NodeTypes.BoardView,
  NodeTypes.CalendarView,
];
