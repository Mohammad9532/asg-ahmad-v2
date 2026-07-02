<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

trait MasterCrudTrait
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = forward_static_call([$this->modelClass, 'query']);
        
        if (isset($this->withRelations)) {
            $query->with($this->withRelations);
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = $request->input('per_page', 15);
        $data = $query->latest()->paginate($perPage);

        return response()->json($data);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->validationRules());

        $model = forward_static_call([$this->modelClass, 'create'], $validated);

        if (isset($this->withRelations)) {
            $model->load($this->withRelations);
        }

        return response()->json($model, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $query = forward_static_call([$this->modelClass, 'query']);
        if (isset($this->withRelations)) {
            $query->with($this->withRelations);
        }

        $model = $query->findOrFail($id);
        return response()->json($model);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $model = forward_static_call([$this->modelClass, 'findOrFail'], $id);

        $validated = $request->validate($this->validationRules($id));

        $model->update($validated);

        if (isset($this->withRelations)) {
            $model->load($this->withRelations);
        }

        return response()->json($model);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $model = forward_static_call([$this->modelClass, 'findOrFail'], $id);
        $model->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
