<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Super Admin',
            'Owner',
            'Accountant',
            'Shop Manager',
            'Cashier',
            'Viewer',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName]);
        }

        $superAdminRole = Role::where('name', 'Super Admin')->first();

        User::firstOrCreate(
            ['email' => 'admin@asg-erp.com'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('password'),
                'role_id' => $superAdminRole->id,
                'shop_id' => null, // Global
                'is_active' => true,
            ]
        );
    }
}
