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
        Schema::create('themes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('bg_type', ['solid', 'gradient', 'image'])->default('solid');
            $table->string('bg_color', 7)->nullable();
            $table->string('bg_gradient_from', 7)->nullable();
            $table->string('bg_gradient_to', 7)->nullable();
            $table->unsignedSmallInteger('bg_gradient_angle')->default(135);
            $table->string('bg_image_path')->nullable();
            $table->string('text_color', 7)->default('#ffffff');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};
