export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  badge?: {
    title?: string;
    type?: string;
  };
  children?: NavigationItem[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'item',
    icon: 'feather icon-home',
    url: '/dashboard/analytics'
  },
  {
    id: 'ui-element',
    title: 'UI ELEMENT',
    type: 'group',
    icon: 'feather icon-layers',
    children: [
      {
        id: 'basic',
        title: 'Basic',
        type: 'collapse',
        icon: 'feather icon-box',
        children: [
          {
            id: 'button',
            title: 'Button',
            type: 'item',
            url: '/dashboard/component/button'
          },
          {
            id: 'badges',
            title: 'Badges',
            type: 'item',
            url: '/dashboard/component/badges'
          },
          {
            id: 'breadcrumb-pagination',
            title: 'Breadcrumb & Pagination',
            type: 'item',
            url: '/dashboard/component/breadcrumb-paging'
          },
          {
            id: 'collapse',
            title: 'Collapse',
            type: 'item',
            url: '/dashboard/component/collapse'
          },
          {
            id: 'tabs-pills',
            title: 'Tabs & Pills',
            type: 'item',
            url: '/dashboard/component/tabs-pills'
          },
          {
            id: 'typography',
            title: 'Typography',
            type: 'item',
            url: '/dashboard/component/typography'
          }
        ]
      },
      {
        id: 'forms',
        title: 'Form & Table',
        type: 'collapse',
        icon: 'feather icon-file-text',
        children: [
          {
            id: 'forms-element',
            title: 'Form Elements',
            type: 'item',
            url: '/dashboard/forms'
          },
          {
            id: 'tables',
            title: 'Table',
            type: 'item',
            url: '/dashboard/tables'
          }
        ]
      }
    ]
  },
  {
    id: 'chart',
    title: 'Chart',
    type: 'group',
    icon: 'feather icon-pie-chart',
    children: [
      {
        id: 'apexchart',
        title: 'ApexChart',
        type: 'item',
        icon: 'feather icon-pie-chart',
        url: '/dashboard/chart'
      }
    ]
  },
  {
    id: 'pages',
    title: 'Pages',
    type: 'group',
    icon: 'feather icon-layers',
    children: [
      {
        id: 'auth',
        title: 'Authentication',
        type: 'collapse',
        icon: 'feather icon-lock',
        children: [
          {
            id: 'signup',
            title: 'Sign up',
            type: 'item',
            url: '/register',
            target: true,
            breadcrumbs: false
          },
          {
            id: 'signin',
            title: 'Sign in',
            type: 'item',
            url: '/login',
            target: true,
            breadcrumbs: false
          }
        ]
      },
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        icon: 'feather icon-sidebar',
        url: '/dashboard/sample-page'
      }
    ]
  }
];
