package util

import "strings"

func ListStringToString(list []string, separator string) string {
	return strings.Join(list, separator)
}
