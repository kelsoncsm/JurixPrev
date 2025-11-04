// Angular Import
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { roleGuard } from './guards/role.guard';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';

const routes: Routes = [
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/sign-in/sign-in.component').then((c) => c.SignInComponent)
      },
      {
        path: 'logout',
        loadComponent: () => import('./components/auth/logout/logout.component').then((c) => c.LogoutComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./components/auth/register-user/register-user.component').then((c) => c.RegisterUserComponent),
        canMatch: [roleGuard(['ADMINISTRATIVO'])]
      }
    ]
  },
  {
    path: 'dashboard',
    component: AdminComponent,
    canMatch: [roleGuard(['ADMINISTRATIVO'])],
    children: [
      {
        path: '',
        redirectTo: 'sample-page',
        pathMatch: 'full'
      },
      {
        path: 'component',
        loadChildren: () => import('./demo/ui-element/ui-basic.module').then((m) => m.UiBasicModule)
      },
      {
        path: 'chart',
        loadComponent: () => import('./demo/chart-maps/core-apex.component').then((c) => c.CoreApexComponent)
      },
      {
        path: 'forms',
        loadComponent: () => import('./demo/forms/form-elements/form-elements.component').then((c) => c.FormElementsComponent)
      },
      {
        path: 'logout',
        loadComponent: () => import('./components/auth/logout/logout.component').then((c) => c.LogoutComponent)
      },
      {
        path: 'tables',
        loadComponent: () => import('./demo/tables/tbl-bootstrap/tbl-bootstrap.component').then((c) => c.TblBootstrapComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      },
      
    ]
  },
  {
    path: 'painel-usuario',
    component: AdminComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./components/painel-usuario/painel-usuario.component').then((c) => c.PainelUsuarioComponent)
      }
    ]
  },
  {
    path: 'documentos',
    component: AdminComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./components/documentos/lista-documentos/lista-documentos.component').then((c) => c.ListaDocumentosComponent)
      },
      {
        path: 'novo',
        loadComponent: () => import('./components/documentos/gerar-documento/gerar-documento.component').then((c) => c.GerarDocumentoComponent)
      },
      {
        path: 'editar/:id',
        loadComponent: () => import('./components/documentos/gerar-documento/gerar-documento.component').then((c) => c.GerarDocumentoComponent)
      },
      {
        path: 'visualizar/:id',
        loadComponent: () => import('./components/documentos/gerar-documento/gerar-documento.component').then((c) => c.GerarDocumentoComponent)
      }
    ]
  },
  {
    path: 'clientes',
    component: AdminComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./components/clientes/lista-clientes/lista-clientes.component').then((c) => c.ListaClientesComponent)
      },
      {
        path: 'novo',
        loadComponent: () => import('./components/clientes/cadastrar-cliente/cadastrar-cliente.component').then((c) => c.CadastrarClienteComponent)
      },
      {
        path: 'editar/:id',
        loadComponent: () => import('./components/clientes/cadastrar-cliente/cadastrar-cliente.component').then((c) => c.CadastrarClienteComponent)
      },
      {
        path: 'visualizar/:id',
        loadComponent: () => import('./components/clientes/cadastrar-cliente/cadastrar-cliente.component').then((c) => c.CadastrarClienteComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
