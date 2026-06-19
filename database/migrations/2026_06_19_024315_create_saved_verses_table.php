<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('saved_verses', function (Blueprint $table) {
            $table->id();
            $table->string('reference');
            $table->string('translation', 10)->default('NIV');
            $table->enum('testament', ['old', 'new']);
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saved_verses');
    }
};
