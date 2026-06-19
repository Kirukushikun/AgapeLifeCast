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
        Schema::create('song_slides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->string('label')->nullable();
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('song_slides');
    }
};
