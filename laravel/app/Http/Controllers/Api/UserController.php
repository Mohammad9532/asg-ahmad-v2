<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'shop']);
        
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        $perPage = $request->input('per_page', 15);
        $data = $query->latest()->paginate($perPage);

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile' => 'nullable|string|max:255',
            'shop_id' => 'nullable|exists:shops,id',
            'is_active' => 'boolean',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:roles,name',
        ]);

        // Prevent Owner from creating Super Admin
        if ($validated['role'] === 'Super Admin' && !$request->user()->hasRole('Super Admin')) {
            throw ValidationException::withMessages(['role' => 'You do not have permission to assign the Super Admin role.']);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'] ?? null,
            'shop_id' => $validated['shop_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['role']);
        $user->load(['roles', 'shop']);

        return response()->json($user, 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with(['roles', 'shop'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'mobile' => 'nullable|string|max:255',
            'shop_id' => 'nullable|exists:shops,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|exists:roles,name',
        ]);

        // Prevent Owner from creating/assigning Super Admin
        if ($validated['role'] === 'Super Admin' && !$request->user()->hasRole('Super Admin')) {
            throw ValidationException::withMessages(['role' => 'You do not have permission to assign the Super Admin role.']);
        }
        
        // Prevent editing Super Admin if not Super Admin
        if ($user->hasRole('Super Admin') && !$request->user()->hasRole('Super Admin')) {
            throw ValidationException::withMessages(['user' => 'You do not have permission to edit a Super Admin.']);
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'] ?? null,
            'shop_id' => $validated['shop_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if ($user->roles->pluck('name')->first() !== $validated['role']) {
            $user->syncRoles([$validated['role']]);
        }

        $user->load(['roles', 'shop']);

        return response()->json($user);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        if ($user->hasRole('Super Admin') && !request()->user()->hasRole('Super Admin')) {
            throw ValidationException::withMessages(['user' => 'You do not have permission to delete a Super Admin.']);
        }

        $user->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
