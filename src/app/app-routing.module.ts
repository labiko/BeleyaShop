import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminAuthGuard } from './guards/admin-auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'catalog',
    loadChildren: () => import('./catalog/catalog.module').then( m => m.CatalogPageModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./cart/cart.module').then( m => m.CartPageModule)
  },
  {
    path: 'delivery',
    loadChildren: () => import('./delivery/delivery.module').then( m => m.DeliveryPageModule)
  },
  {
    path: 'delivery/order/:orderNumber',
    loadComponent: () => import('./delivery-order/delivery-order.page').then(m => m.DeliveryOrderPage)
  },
  // Routes admin
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/admin-login.page').then(m => m.AdminLoginPage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-tabs/admin-tabs.page').then(m => m.AdminTabsPage),
    canActivate: [AdminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/admin-products.page').then(m => m.AdminProductsPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/orders/admin-orders.page').then(m => m.AdminOrdersPage)
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/categories/admin-categories.page').then(m => m.AdminCategoriesPage)
      },
      {
        path: 'delivery-personnel',
        loadComponent: () => import('./admin/delivery-personnel/admin-delivery-personnel.page').then(m => m.AdminDeliveryPersonnelPage)
      },
      {
        path: 'migration',
        loadComponent: () => import('./admin/migration/migration.component').then(m => m.MigrationComponent)
      }
    ]
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
