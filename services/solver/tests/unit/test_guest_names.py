"""Unit tests for the astro-themed guest name generator."""

import re

from app.guest_names import ADJECTIVES, NOUNS, generate_guest_name


GUEST_NAME_PATTERN = re.compile(r"^([a-z]+)-([a-z]+)-([0-9a-f]{4})$")


class TestGenerateGuestName:
    def test_format_matches_expected_pattern(self):
        for _ in range(50):
            name = generate_guest_name()
            assert GUEST_NAME_PATTERN.match(name), f"Unexpected format: {name}"

    def test_uses_words_from_dictionaries(self):
        for _ in range(50):
            name = generate_guest_name()
            adj, noun, _ = name.split("-")
            assert adj in ADJECTIVES
            assert noun in NOUNS

    def test_is_random_not_deterministic(self):
        # 50 draws should practically never collide given the ~100M space
        names = {generate_guest_name() for _ in range(50)}
        assert len(names) == 50

    def test_hex_suffix_lowercase_only(self):
        for _ in range(20):
            name = generate_guest_name()
            suffix = name.split("-")[-1]
            assert suffix == suffix.lower()
            assert len(suffix) == 4
            int(suffix, 16)  # must be valid hex


class TestWordLists:
    def test_adjectives_all_lowercase_and_simple(self):
        for word in ADJECTIVES:
            assert word == word.lower()
            assert "-" not in word
            assert " " not in word

    def test_nouns_all_lowercase_and_simple(self):
        for word in NOUNS:
            assert word == word.lower()
            assert "-" not in word
            assert " " not in word

    def test_dictionaries_have_meaningful_size(self):
        # Documented expectation: at least ~1M combinations per adj/noun pair
        # (4 hex chars = 65536), total ≥ 30M
        assert len(ADJECTIVES) >= 20
        assert len(NOUNS) >= 20
        combinations = len(ADJECTIVES) * len(NOUNS) * 65536
        assert combinations >= 30_000_000
